import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import random

# Generate 50 mock tickets
data = []
issues = [
    "AC making a grinding noise", "Wi-Fi keeps dropping in the living room", 
    "Need extra towels", "Kitchen sink is leaking", "Smart TV won't turn on",
    "Broken window latch", "Stains on the carpet", "Heater is blowing cold air"
]

for i in range(1, 51):
    reported = datetime.now() - timedelta(days=random.randint(1, 10))
    # Make 30% of tickets "stale" (updated > 72 hours ago)
    if random.random() < 0.3:
        updated = reported + timedelta(hours=random.randint(1, 24))
    else:
        updated = datetime.now() - timedelta(hours=random.randint(1, 12))
        
    data.append({
        "ticket_id": f"TKT-{1000+i}",
        "guest_name": f"Guest {i}",
        "unit_number": f"{random.randint(1,5)}0{random.randint(1,9)}",
        "issue_description": random.choice(issues),
        "priority": np.nan if random.random() < 0.4 else random.choice(["Low", "Medium"]), # 40% missing priority
        "status": "Open",
        "assigned_to": np.nan,
        "date_reported": reported,
        "last_updated": updated
    })

df = pd.DataFrame(data)
df.to_csv("mock_ops_data.csv", index=False)
print("Generated mock_ops_data.csv successfully!")