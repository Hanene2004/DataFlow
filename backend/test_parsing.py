import pandas as pd
import io
import sys
import os

# Add current dir to path to import from main
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from processing import read_csv_smart

def test_parsing():
    print("Running parsing tests...")
    
    # Test 1: Standard Comma CSV (UTF-8)
    csv_comma = b"id,name,value\n1,Alice,100\n2,Bob,200"
    df1 = read_csv_smart(csv_comma)
    print(f"Test 1 (Comma): Columns={list(df1.columns)}, Rows={len(df1)}")
    assert len(df1.columns) == 3
    assert len(df1) == 2

    # Test 2: Semicolon CSV (Latin-1/ISO-8859-1 style)
    csv_semi = "age;job;marital\n30;clerk;married\n25;student;single".encode('latin1')
    df2 = read_csv_smart(csv_semi)
    print(f"Test 2 (Semicolon): Columns={list(df2.columns)}, Rows={len(df2)}")
    assert len(df2.columns) == 3
    assert len(df2) == 2

    # Test 3: Tab Separated (UTF-16)
    csv_tab = "id\tscore\n1\t95\n2\t88".encode('utf-16')
    df3 = read_csv_smart(csv_tab)
    print(f"Test 3 (Tab/UTF-16): Columns={list(df3.columns)}, Rows={len(df3)}")
    assert len(df3.columns) == 2
    assert len(df3) == 2

    print("All parsing tests passed!")

if __name__ == "__main__":
    try:
        test_parsing()
    except Exception as e:
        print(f"Test failed: {e}")
        sys.exit(1)
