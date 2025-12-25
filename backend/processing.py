import pandas as pd
import numpy as np
import io

def read_csv_smart(content_bytes: bytes):
    """
    Attempts to read CSV with multiple encodings and separators.
    Aggressively detects the correct configuration.
    """
    # Encodings to try. utf-8-sig handles BOM for UTF-8. 
    # utf-16 is BOM-aware. latin1/cp1252 for older European files.
    encodings = ['utf-8-sig', 'utf-16', 'latin1', 'cp1252', 'utf-8']
    separators = [';', ',', '\t', '|']
    
    best_df = None
    max_score = -1
    
    for enc in encodings:
        try:
            # Decode content
            text = content_bytes.decode(enc)
            lines = text.splitlines()
            if not lines:
                continue
                
            first_line = lines[0].strip()
            
            # Heuristic: Count occurrences of separators in the first line
            # If one separator is clearly dominant, prioritize it.
            sep_counts = {s: first_line.count(s) for s in separators}
            sorted_seps = sorted(separators, key=lambda s: sep_counts[s], reverse=True)
            
            # If no separators found, stick to comma but stay open
            if sum(sep_counts.values()) == 0:
                sorted_seps = [','] + [s for s in separators if s != ',']

            for sep in sorted_seps:
                try:
                    # Using quotechar and doublequote to handle industrial CSV exports properly
                    df = pd.read_csv(io.StringIO(text), sep=sep, quotechar='"', doublequote=True)
                    
                    if df.empty:
                        continue
                        
                    # Calculate score: 
                    # 1. Number of columns (priority)
                    num_cols = len(df.columns)
                    
                    # 2. Penalty for many Unnamed columns (bad parsing)
                    unnamed_cols = sum(1 for c in df.columns if 'Unnamed' in str(c))
                    
                    # 3. Heavy penalty if only 1 column is found but it contains other separators
                    # This means we probably missed the real separator
                    score = num_cols * 100 - unnamed_cols * 10
                    
                    if num_cols == 1:
                        if any(s in str(df.columns[0]) for s in separators if s != sep):
                            score -= 500 # Strong penalty for not splitting
                        if len(str(df.columns[0])) > 100:
                            score -= 200 # Penalty for suspicious single long header
                    
                    # 4. Check for invalid characters (sign of wrong encoding)
                    header_str = "".join(str(c) for c in df.columns)
                    if any(ord(c) < 32 for c in header_str if ord(c) not in [10, 13]):
                        score -= 300

                    if score > max_score:
                        max_score = score
                        best_df = df
                        
                    # Optimization: If we found a clear win (multiple columns, no unnamed)
                    if num_cols > 2 and unnamed_cols == 0 and score > 200:
                        return best_df
                        
                except Exception:
                    continue
        except UnicodeDecodeError:
            continue
            
    if best_df is not None:
        # Final cleanup: Strip quotes from column names if they weren't swallowed
        best_df.columns = [str(c).replace('"', '').strip() for c in best_df.columns]
        return best_df
    
    # Final fallback if nothing worked well
    return pd.read_csv(io.BytesIO(content_bytes), sep=None, engine='python')

def read_excel_smart(content_bytes: bytes, sheet_name=None):
    """
    Reads excel file. If no sheet_name is provided, returns the most 'populated' sheet.
    Also returns list of sheet names if multiple exist.
    Tries to detect header if it's not in the first row.
    """
    try:
        excel_file = pd.ExcelFile(io.BytesIO(content_bytes))
        sheet_names = excel_file.sheet_names
        
        if sheet_name is None:
            # Simple heuristic: Find sheet with most non-empty values
            best_sheet = sheet_names[0]
            max_non_null = -1
            
            for name in sheet_names:
                # Load header=None to see full raw content
                test_df = excel_file.parse(name, header=None)
                non_null_count = test_df.notna().sum().sum()
                if non_null_count > max_non_null:
                    max_non_null = non_null_count
                    best_sheet = name
            sheet_name = best_sheet

        # Load raw sheet without assuming first row is header
        df_raw = excel_file.parse(sheet_name, header=None)
        
        # Heuristic to find header row: First row with at least 2 non-empty columns 
        # that doesn't look like purely numeric data
        header_row_idx = 0
        for i, row in df_raw.iterrows():
            non_null = row.dropna()
            if len(non_null) >= 2:
                # Check if it's mostly strings (likely header)
                if sum(isinstance(val, str) for val in non_null) >= len(non_null) * 0.5:
                    header_row_idx = i
                    break
        
        # Re-read or slice from header row
        df = excel_file.parse(sheet_name, skiprows=header_row_idx)
            
        # Cleanup: Remove completely empty rows/cols
        df = df.dropna(how='all', axis=0).dropna(how='all', axis=1)
        
        # Ensure column names are strings and not empty
        df.columns = [str(c) if pd.notnull(c) else f"Column_{i}" for i, c in enumerate(df.columns)]
        
        return df, sheet_names, sheet_name
    except Exception as e:
        raise Exception(f"Failed to read Excel file: {str(e)}")

def detect_domain(df: pd.DataFrame) -> str:
    columns = set(df.columns.str.lower())
    
    financial_keywords = {'revenue', 'sales', 'profit', 'cost', 'expenses', 'budget', 'forecast', 'price', 'amount', 'currency'}
    hr_keywords = {'employee', 'salary', 'department', 'position', 'hired', 'performance', 'manager', 'tenure', 'age'}
    commercial_keywords = {'customer', 'client', 'product', 'order', 'lead', 'conversion', 'churn', 'market'}
    
    financial_score = len(columns.intersection(financial_keywords))
    hr_score = len(columns.intersection(hr_keywords))
    commercial_score = len(columns.intersection(commercial_keywords))
    
    scores = {'Financial': financial_score, 'HR': hr_score, 'Commercial': commercial_score}
    best_match = max(scores, key=scores.get)
    
    if scores[best_match] > 0:
        return best_match
    return "General"

def detect_anomalies(df: pd.DataFrame) -> list:
    anomalies = []
    
    # Check for duplicates
    duplicate_count = df.duplicated().sum()
    if duplicate_count > 0:
        anomalies.append(f"Found {duplicate_count} duplicate rows.")
        
    for col in df.select_dtypes(include=[np.number]).columns:
        # Check for outliers using IQR
        Q1 = df[col].quantile(0.25)
        Q3 = df[col].quantile(0.75)
        IQR = Q3 - Q1
        
        # Define loose bounds to avoid too many false positives
        lower_bound = Q1 - 3 * IQR
        upper_bound = Q3 + 3 * IQR
        
        outliers = df[(df[col] < lower_bound) | (df[col] > upper_bound)]
        if not outliers.empty:
            count = len(outliers)
            anomalies.append(f"Column '{col}' has {count} potential outliers (extreme values).")
            
        # Check for negative values where they might be inappropriate (heuristic)
        if (df[col] < 0).any() and col.lower() in ['age', 'price', 'quantity', 'count']:
             anomalies.append(f"Column '{col}' contains negative values which might be incorrect.")

    return anomalies

def generate_summary(df: pd.DataFrame, stats: list, domain: str) -> str:
    summary = []
    
    row_count = len(df)
    summary.append(f"The dataset contains {row_count} records related to {domain} data.")
    
    # Trend analysis (if date column exists)
    date_cols = [col for col in df.columns if 'date' in col.lower() or 'time' in col.lower()]
    metric_cols = [s['name'] for s in stats if s.get('type') == 'numeric']
    
    if date_cols and metric_cols:
        date_col = date_cols[0]
        try:
            df[date_col] = pd.to_datetime(df[date_col], errors='coerce')
            df_sorted = df.dropna(subset=[date_col]).sort_values(by=date_col)
            
            if not df_sorted.empty:
                start_date = df_sorted[date_col].iloc[0].strftime('%Y-%m-%d')
                end_date = df_sorted[date_col].iloc[-1].strftime('%Y-%m-%d')
                summary.append(f"The data covers the period from {start_date} to {end_date}.")
                
                # Simple Correlation check for summary
                metric = metric_cols[0]
                first_val = df_sorted[metric].iloc[0]
                last_val = df_sorted[metric].iloc[-1]
                
                if first_val > 0:
                    change_pct = ((last_val - first_val) / first_val) * 100
                    direction = "increased" if change_pct > 0 else "decreased"
                    summary.append(f"The {metric} has {direction} by {abs(change_pct):.1f}% over this period.")
        except:
            pass
            
    # Generic stat summary
    for stat in stats[:2]: # First two columns details
        if stat.get('type') == 'numeric':
             summary.append(f"The average {stat['name']} is {stat.get('mean', 0):.2f}.")
             
    if domain == "Financial" and any('profit' in c.lower() for c in df.columns):
         summary.append("Financial health Check: Profit margins detected.")
         
    return " ".join(summary)

def generate_kpis(df: pd.DataFrame, domain: str) -> list:
    kpis = []
    
    # helper to find columns
    date_cols = [col for col in df.columns if 'date' in col.lower() or 'time' in col.lower()]
    
    # Identify potential metric columns based on domain or names
    metric_keywords = ['revenue', 'sales', 'profit', 'amount', 'cost', 'price', 'score', 'salary']
    potential_metrics = [c for c in df.select_dtypes(include=[np.number]).columns if any(k in c.lower() for k in metric_keywords)]
    
    if not potential_metrics and not df.empty:
         # Fallback to first numeric column if no specific keywords found
         potential_metrics = [c for c in df.select_dtypes(include=[np.number]).columns][:1]

    if not potential_metrics:
        return []

    # KPI 1: Overall Total/Average of main metric
    main_metric = potential_metrics[0]
    total_val = df[main_metric].sum()
    kpis.append({
        "label": f"Total {main_metric}",
        "value": f"{total_val:,.2f}",
        "trend": 0, # Placeholder
        "trend_label": "vs Total"
    })

    # KPI 2: Trend if date exists
    if date_cols:
        date_col = date_cols[0]
        try:
            df[date_col] = pd.to_datetime(df[date_col], errors='coerce')
            df_sorted = df.dropna(subset=[date_col]).sort_values(by=date_col)
            
            if not df_sorted.empty:
                # Split into two halves for simple comparison
                mid_point = len(df_sorted) // 2
                period1 = df_sorted.iloc[:mid_point]
                period2 = df_sorted.iloc[mid_point:]
                
                val1 = period1[main_metric].sum()
                val2 = period2[main_metric].sum()
                
                if val1 > 0:
                    change = ((val2 - val1) / val1) * 100
                    kpis.append({
                        "label": f"{main_metric} Growth",
                        "value": f"{change:+.1f}%",
                        "trend": change,
                        "trend_label": "vs Previous Period"
                    })
        except:
            pass
            
    return kpis

def process_data(df: pd.DataFrame):
    stats = []
    for col in df.columns:
        col_data = df[col]
        
        # Basic stats
        missing_count = int(col_data.isna().sum())
        unique_count = int(col_data.nunique())
        
        col_stats = {
            "name": col,
            "missing": missing_count,
            "unique": unique_count
        }
        
        # Determine type and compute numeric stats if applicable
        if pd.api.types.is_numeric_dtype(col_data):
            col_stats["type"] = "numeric"
            if not col_data.empty:
                # Advanced Stats
                median = float(col_data.median()) if pd.notnull(col_data.median()) else 0
                q1 = float(col_data.quantile(0.25)) if pd.notnull(col_data.quantile(0.25)) else 0
                q3 = float(col_data.quantile(0.75)) if pd.notnull(col_data.quantile(0.75)) else 0
                iqr = q3 - q1
                skew = float(col_data.skew()) if pd.notnull(col_data.skew()) else 0
                kurt = float(col_data.kurtosis()) if pd.notnull(col_data.kurtosis()) else 0
                
                col_stats.update({
                    "min": float(col_data.min()) if pd.notnull(col_data.min()) else 0,
                    "max": float(col_data.max()) if pd.notnull(col_data.max()) else 0,
                    "mean": float(col_data.mean()) if pd.notnull(col_data.mean()) else 0,
                    "std": float(col_data.std()) if pd.notnull(col_data.std()) else 0,
                    "median": median,
                    "q1": q1,
                    "q3": q3,
                    "iqr": iqr,
                    "skew": skew,
                    "kurtosis": kurt
                })
        else:
            col_stats["type"] = "categorical"
            # Optional: Add mode or other categorical stats here

        stats.append(col_stats)
    return stats


def calculate_quality_score(df: pd.DataFrame) -> dict:
    score = 100
    penalties = []

    # 1. Missing Values Penalty
    total_cells = df.size
    total_missing = df.isna().sum().sum()
    missing_pct = (total_missing / total_cells) * 100 if total_cells > 0 else 0
    
    if missing_pct > 0:
        penalty = min(30, missing_pct * 1.5) # Cap at 30 points
        score -= penalty
        penalties.append(f"Missing Values: -{penalty:.1f} ({(missing_pct):.1f}% data missing)")

    # 2. Duplicate Rows Penalty
    duplicate_rows = df.duplicated().sum()
    if duplicate_rows > 0:
        duplicate_pct = (duplicate_rows / len(df)) * 100
        penalty = min(20, duplicate_pct * 2) # Cap at 20 points
        score -= penalty
        penalties.append(f"Duplicate Rows: -{penalty:.1f} ({duplicate_rows} duplicates found)")

    # 3. Data Types Uniformity (Heuristic)
    mixed_type_penalty = 0
    for col in df.select_dtypes(include=['object']):
        try:
             numeric_conversion = pd.to_numeric(df[col], errors='coerce')
             valid_ratio = numeric_conversion.notna().sum() / len(df)
             if valid_ratio > 0.8 and valid_ratio < 1.0:
                 mixed_type_penalty += 5
        except:
            pass
    
    if mixed_type_penalty > 0:
        actual_penalty = min(15, mixed_type_penalty)
        score -= actual_penalty
        penalties.append(f"Mixed Data Types: -{actual_penalty} (Potential formatting issues)")

    return {
        "score": max(0, round(score)),
        "penalties": penalties,
        "grade": "A" if score >= 90 else "B" if score >= 80 else "C" if score >= 60 else "D"
    }

def generate_recommendations(df: pd.DataFrame) -> list:
    recs = []
    
    # 1. Date Column
    date_cols = [col for col in df.columns if 'date' in col.lower() or 'time' in col.lower()]
    has_datetime = any(pd.api.types.is_datetime64_any_dtype(df[col]) for col in df.columns)
    
    if not date_cols and not has_datetime:
        recs.append("Add a 'Date' or 'Time' column to enable time-series analysis and trend visualization.")
    elif date_cols and not has_datetime:
        recs.append(f"Convert column '{date_cols[0]}' to DateTime format for better time-based features.")

    # 2. Missing Values
    missing_series = df.isna().sum()
    cols_with_missing = missing_series[missing_series > 0]
    if not cols_with_missing.empty:
        for col, count in cols_with_missing.items():
            pct = (count / len(df)) * 100
            if pct > 10:
                recs.append(f"Column '{col}' has {pct:.1f}% missing values. Consider imputing with Mean/Median or dropping it.")
    
    # 3. Categorical High Cardinality
    for col in df.select_dtypes(include=['object', 'category']):
        unique_count = df[col].nunique()
        if unique_count > 50 and unique_count < len(df) * 0.9:
           recs.append(f"Column '{col}' has high cardinality ({unique_count} unique values). Consider grouping minor categories.")

    # 4. Id Columns
    for col in df.columns:
        if 'id' in col.lower() and df[col].nunique() == len(df):
             recs.append(f"Column '{col}' appears to be a unique identifier. It provides no analytical value for aggregation.")

    return recs

def compare_datasets(df1: pd.DataFrame, df2: pd.DataFrame, name1: str, name2: str) -> dict:
    cols1 = set(df1.columns)
    cols2 = set(df2.columns)
    
    common_cols = list(cols1.intersection(cols2))
    added_cols = list(cols2 - cols1)
    removed_cols = list(cols1 - cols2)
    
    rows1 = len(df1)
    rows2 = len(df2)
    row_diff = rows2 - rows1
    
    comparison_stats = []
    for col in common_cols:
        if pd.api.types.is_numeric_dtype(df1[col]) and pd.api.types.is_numeric_dtype(df2[col]):
            mean1 = df1[col].mean()
            mean2 = df2[col].mean()
            diff_mean = mean2 - mean1
            pct_change = (diff_mean / mean1 * 100) if mean1 != 0 else 0
            
            comparison_stats.append({
                "column": col,
                "mean_v1": mean1,
                "mean_v2": mean2,
                "diff_pct": pct_change,
                "status": "increased" if diff_mean > 0 else "decreased" if diff_mean < 0 else "same"
            })

    return {
        "files": [name1, name2],
        "schema_diff": {
            "added_columns": added_cols,
            "removed_columns": removed_cols,
            "common_columns": common_cols
        },
        "row_diff": {
            "count_v1": rows1,
            "count_v2": rows2,
            "difference": row_diff
        },
        "value_comparison": comparison_stats
    }

def calculate_advanced_correlations(df: pd.DataFrame) -> list:
    numeric_df = df.select_dtypes(include=[np.number])
    if numeric_df.empty:
        return []
        
    corr_matrix = numeric_df.corr(method='pearson')
    correlations = []
    columns = corr_matrix.columns
    
    for i in range(len(columns)):
        for j in range(i+1, len(columns)):
            col1 = columns[i]
            col2 = columns[j]
            val = corr_matrix.iloc[i, j]
            
            if abs(val) > 0.1: 
                correlations.append({
                    "col1": col1,
                    "col2": col2,
                    "correlation": float(val)
                })
                
    correlations.sort(key=lambda x: abs(x['correlation']), reverse=True)
    return correlations

def merge_datasets(data1: list, data2: list, merge_key: str, how: str = 'inner'):
    """
    Merges two datasets and returns the merged DataFrame and its stats.
    """
    df1 = pd.DataFrame(data1)
    df2 = pd.DataFrame(data2)
    
    # Perform merge
    merged_df = pd.merge(df1, df2, on=merge_key, how=how)
    
    # Process stats for the new dataset
    stats = process_data(merged_df)
    
    return merged_df, stats
