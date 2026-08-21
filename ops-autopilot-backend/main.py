from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
import pandas as pd
import json
import os
import uvicorn
from openai import OpenAI
from dotenv import load_dotenv
from pydantic import BaseModel

load_dotenv()

# Initialize DeepSeek Client (OpenAI compatible)
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"), base_url="https://api.deepseek.com")

app = FastAPI(title="Ops Autopilot API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://ops.adnanrp.com"], # Next.js default port
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory state for the weekend build
current_df = None
profile_stats = {}

@app.post("/api/upload-and-profile")
async def upload_and_profile(file: UploadFile = File(...)):
    global current_df, profile_stats
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="File must be a CSV")
    
    # 1. Safely read the file bytes asynchronously
    contents = await file.read()
    
    # 2. Convert bytes to a file-like object for Pandas
    current_df = pd.read_csv(io.BytesIO(contents))
    
    # DETERMINISTIC PROFILING (No AI yet)
    current_df['last_updated'] = pd.to_datetime(current_df['last_updated'])
    now = pd.Timestamp.now()
    current_df['hours_since_update'] = (now - current_df['last_updated']).dt.total_seconds() / 3600
    
    # Find anomalies
    overdue_tickets = current_df[(current_df['status'] == 'Open') & (current_df['hours_since_update'] > 72)]
    missing_priority = current_df[current_df['priority'].isna() | (current_df['priority'] == '')]
    
    profile_stats = {
        "total_tickets": len(current_df),
        "overdue_count": len(overdue_tickets),
        "missing_priority_count": len(missing_priority),
        "overdue_ids": overdue_tickets['ticket_id'].tolist(),
        "needs_attention_ids": missing_priority['ticket_id'].tolist()
    }
    
    return {
        "message": "Profiling complete. Deterministic analysis complete.",
        "stats": profile_stats
    }

@app.get("/api/download-csv")
async def download_csv():
    file_path = "processed_ops_data.csv"
    if os.path.exists(file_path):
        # Serve the file securely through the API
        return FileResponse(
            path=file_path, 
            media_type='text/csv', 
            filename="automated_ops_report.csv"
        )
    raise HTTPException(status_code=404, detail="No processed file found. Please run the automation first.")

@app.post("/api/generate-recommendations")
async def generate_recommendations():
    global current_df
    if current_df is None:
        raise HTTPException(status_code=400, detail="Upload a file first")
        
    # Filter only rows that need AI help (Missing priority or overdue)
    messy_df = current_df[
        (current_df['priority'].isna()) | 
        (current_df['priority'] == '') | 
        (current_df['hours_since_update'] > 72)
    ]
    
    if messy_df.empty:
        return {"message": "No messy data found. Perfect operations!"}

    # Prepare data for LLM (only send necessary columns to save tokens)
    tickets_to_process = messy_df[['ticket_id', 'issue_description', 'unit_number']].to_dict(orient='records')
    
    prompt = f"""
    You are an expert property operations manager. Review the following maintenance requests. 
    Return ONLY a valid JSON array of objects. Do not include markdown formatting.
    Each object must contain:
    - "ticket_id": string
    - "priority": "High", "Medium", or "Low"
    - "category": "Maintenance", "Housekeeping", or "IT"
    - "assigned_to": "Maintenance Team", "Housekeeping Staff", or "IT Support"
    - "draft_message": A polite, 1-sentence message to the guest acknowledging the issue.
    
    Data:
    {json.dumps(tickets_to_process)}
    """

    try:
        response = client.chat.completions.create(
            model="deepseek-chat",
            messages=[
                {"role": "system", "content": "You are a helpful assistant that outputs strict JSON."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3 # Keep it deterministic
        )
        
        content = response.choices[0].message.content.strip()
        # Clean up potential markdown code blocks if the LLM adds them
        if content.startswith("```json"):
            content = content[7:]
        if content.endswith("```"):
            content = content[:-3]
            
        ai_recommendations = json.loads(content)
        
        # Merge AI recommendations back into our main dataframe
        for rec in ai_recommendations:
            idx = current_df[current_df['ticket_id'] == rec['ticket_id']].index
            if not idx.empty:
                current_df.loc[idx[0], 'priority'] = rec['priority']
                current_df.loc[idx[0], 'assigned_to'] = rec['assigned_to']
                current_df.loc[idx[0], 'ai_message'] = rec['draft_message']
                
        return {"recommendations": ai_recommendations}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"DeepSeek API Error: {str(e)}")

class ExecuteRequest(BaseModel):
    approved_ids: list[str]

# Update the endpoint to use the model
@app.post("/api/execute-automation")
async def execute_automation(request: ExecuteRequest):
    global current_df
    if current_df is None:
        raise HTTPException(status_code=400, detail="No data loaded")
        
    # Extract the list from the Pydantic model
    approved_ids = request.approved_ids 
    
    # Deterministic Execution
    current_df.loc[current_df['ticket_id'].isin(approved_ids), 'status'] = 'In Progress'
    
    processed_count = len(approved_ids)
    manual_time_minutes = processed_count * 3 
    hours_saved = manual_time_minutes / 60
    
    output_path = "processed_ops_data.csv"
    current_df.to_csv(output_path, index=False)
    
    return {
        "message": f"Successfully automated {processed_count} tasks.",
        "metrics": {
            "tasks_automated": processed_count,
            "hours_saved": round(hours_saved, 2),
            "manual_steps_removed": processed_count * 4 
        }
    }

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)