import pandas as pd
import io
import os
import sys

# Add current directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from processing import read_excel_smart

def test_robust_excel():
    print("🚀 Starting Robust Excel Extraction Test...")
    
    # Create a dummy excel in-memory with multiple sheets and messy headers
    output = io.BytesIO()
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        # Sheet 1: Empty
        pd.DataFrame([]).to_excel(writer, sheet_name='EmptySheet', index=False)
        
        # Sheet 2: Header starts on row 5
        data = {
            'ID': [1, 2, 3],
            'Name': ['Alice', 'Bob', 'Charlie'],
            'Value': [100, 200, 300]
        }
        df = pd.DataFrame(data)
        # Write some junk at the top
        pd.DataFrame([['Junk Header'], ['More Junk']]).to_excel(writer, sheet_name='DataSheet', index=False, header=False, startrow=0)
        df.to_excel(writer, sheet_name='DataSheet', index=False, startrow=4)
        
    excel_bytes = output.getvalue()
    
    print("Testing smart detection (should pick DataSheet)...")
    df_result, sheets, active = read_excel_smart(excel_bytes)
    
    print(f"Detected sheets: {sheets}")
    print(f"Active sheet: {active}")
    print(f"Columns: {list(df_result.columns)}")
    print(f"Row count: {len(df_result)}")
    
    assert active == 'DataSheet'
    assert 'Name' in df_result.columns
    assert len(df_result) == 3
    print("✅ Test Passed: Smart detection worked!")

    print("\nTesting explicit sheet selection...")
    df_result, _, active = read_excel_smart(excel_bytes, sheet_name='EmptySheet')
    print(f"Active sheet: {active}")
    print(f"Row count: {len(df_result)}")
    assert active == 'EmptySheet'
    print("✅ Test Passed: Explicit selection worked!")

if __name__ == "__main__":
    try:
        test_robust_excel()
        print("\n✨ All extraction tests passed!")
    except Exception as e:
        print(f"\n❌ Test Failed: {e}")
        sys.exit(1)
