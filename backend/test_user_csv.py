import pandas as pd
import io
import sys
import os

# Add current dir to path to import from processing
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from processing import read_csv_smart

def test_user_format():
    print("🚀 Testing User's Specific CSV Format...")
    
    # Header copied from user's screenshot
    # Note: age has no quotes, but the others do
    header = 'age;"job";"marital";"education";"default";"balance";"housing";"loan";"contact";"day";"month";"duration";"campaign";"pdays";"previous";"poutcome";"y"'
    row1 = '30;"management";"married";"tertiary";"no";2133;"no";"no";"unknown";19;"oct";79;1;-1;0;"unknown";"no"'
    
    csv_content = (header + "\n" + row1).encode('utf-8')
    
    print("\nContent to parse:")
    print(csv_content.decode('utf-8'))
    
    df = read_csv_smart(csv_content)
    
    print("\nResult:")
    print(f"Columns: {list(df.columns)}")
    print(f"Number of columns: {len(df.columns)}")
    print(f"Rows: {len(df)}")
    
    if len(df.columns) > 1:
        print("✅ SUCCESS: Correctlly split into multiple columns.")
    else:
        print("❌ FAILURE: Still stuck in a single column.")
        # Print the score-related info if we can (manual debug)
        first_col = df.columns[0]
        print(f"Single column name: {first_col}")

if __name__ == "__main__":
    test_user_format()
