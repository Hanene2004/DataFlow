from fastapi import FastAPI, UploadFile, File, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import io
import uvicorn
import os
import requests
from dotenv import load_dotenv

# Load environment variables
load_dotenv()
from contextlib import asynccontextmanager
import sys
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from processing import (
    process_data, detect_domain, detect_anomalies, generate_summary, 
    generate_kpis, merge_datasets,
    calculate_quality_score, generate_recommendations, 
    compare_datasets, calculate_advanced_correlations,
    read_csv_smart, read_excel_smart
)
from ml import train_and_predict
from datetime import datetime

app = FastAPI()

# Enable CORS for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
@app.get("/")
async def root():
    return {"message": "Data Analysis API is running"}

@app.get("/health")
async def health():
    return {"status": "ok"}

@app.post("/import-url")
async def import_from_url(url: str):
    try:
        response = requests.get(url)
        response.raise_for_status()
        
        # Determine file type from URL or content
        sheet_names = []
        active_sheet = None
        
        if url.endswith('.csv') or 'text/csv' in response.headers.get('Content-Type', ''):
            df = read_csv_smart(response.content)
        elif url.endswith(('.xlsx', '.xls')) or 'application/vnd' in response.headers.get('Content-Type', ''):
            df, sheet_names, active_sheet = read_excel_smart(response.content)
        else:
            # Try smart CSV as fallback
            df = read_csv_smart(response.content)

        df_clean = df.where(pd.notnull(df), None)
        data = df_clean.to_dict(orient='records')
        
        # Comprehensive processing
        stats = process_data(df)
        domain = detect_domain(df)
        anomalies = detect_anomalies(df)
        summary = generate_summary(df, stats, domain)
        kpis = generate_kpis(df, domain)
        quality_score = calculate_quality_score(df)
        recommendations = generate_recommendations(df)
        
        result = {
            "filename": url.split('/')[-1] or "remote_dataset",
            "data": data,
            "domain": domain,
            "columns": list(df.columns),
            "stats": stats,
            "anomalies": anomalies,
            "summary": summary,
            "kpis": kpis,
            "quality_score": quality_score,
            "recommendations": recommendations,
            "sheet_names": sheet_names,
            "active_sheet": active_sheet,
            "timestamp": datetime.now().isoformat()
        }
        
        save_to_store(result["filename"], result)
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to fetch data from URL: {str(e)}")

@app.post("/upload")
async def upload_file(file: UploadFile = File(...), sheet_name: str = Form(None)):
    if not file.filename.endswith(('.csv', '.xlsx', '.xls')):
        raise HTTPException(status_code=400, detail="Invalid file format")
    
    content = await file.read()
    sheet_names = []
    active_sheet = None
    
    try:
        if file.filename.endswith('.csv'):
            df = read_csv_smart(content)
        else:
            df, sheet_names, active_sheet = read_excel_smart(content, sheet_name=sheet_name)
        
        # Replace NaN with None for JSON serialization compatibility
        df_clean = df.where(pd.notnull(df), None)
        
        # Process data for stats
        stats = process_data(df)
        
        # Smart Analysis
        domain = detect_domain(df)
        anomalies = detect_anomalies(df)
        summary = generate_summary(df, stats, domain)
        kpis = generate_kpis(df, domain)
        
        # Quality & Recommendations
        quality_score = calculate_quality_score(df)
        recommendations = generate_recommendations(df)
        
        # Advanced Correlations
        correlations = calculate_advanced_correlations(df)
        
        return {
            "filename": file.filename,
            "rows": len(df),
            "columns": list(df.columns),
            "stats": stats,
            "data": df_clean.to_dict(orient="records"),
            "domain": domain,
            "anomalies": anomalies,
            "summary": summary,
            "kpis": kpis,
            "quality_score": quality_score,
            "recommendations": recommendations,
            "correlations": correlations,
            "sheet_names": sheet_names,
            "active_sheet": active_sheet
        }
    except Exception as e:
        print(f"Error processing file: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/upload-multiple")
async def upload_multiple_files(files: list[UploadFile] = File(...)):
    """
    Accepts multiple files, reads them, and concatenates them into a single dataset.
    Handles different schemas (columns) automatically via outer join.
    """
    if not files:
        raise HTTPException(status_code=400, detail="No files provided")

    dfs = []
    filenames = []

    try:
        for file in files:
            if not file.filename.endswith(('.csv', '.xlsx', '.xls')):
                continue
                
            content = await file.read()
            filenames.append(file.filename)
            
            try:
                if file.filename.endswith('.csv'):
                    df = read_csv_smart(content)
                else:
                    df, _, _ = read_excel_smart(content)
                dfs.append(df)
            except Exception as read_err:
                print(f"Failed to read {file.filename}: {read_err}")
                continue
    
        if not dfs:
            raise HTTPException(status_code=400, detail="Could not read any valid data from provided files")

        # Concatenate all DFs. ignore_index=True resets the index.
        # sort=False prevents sorting columns alphabetically, keeping order somewhat if possible.
        merged_df = pd.concat(dfs, axis=0, ignore_index=True, sort=False)
        
        # Standard processing
        df_clean = merged_df.where(pd.notnull(merged_df), None)
        stats = process_data(merged_df)
        domain = detect_domain(merged_df)
        anomalies = detect_anomalies(merged_df)
        summary = generate_summary(merged_df, stats, domain)
        kpis = generate_kpis(merged_df, domain)
        quality_score = calculate_quality_score(merged_df)
        recommendations = generate_recommendations(merged_df)
        correlations = calculate_advanced_correlations(merged_df)

        combined_filename = "Merged_" + "_".join([f.split('.')[0] for f in filenames[:3]])
        if len(filenames) > 3:
            combined_filename += f"_and_{len(filenames)-3}_more"
            
        return {
            "filename": combined_filename,
            "rows": len(merged_df),
            "columns": list(merged_df.columns),
            "stats": stats,
            "data": df_clean.to_dict(orient="records"),
            "domain": domain,
            "anomalies": anomalies,
            "summary": summary,
            "kpis": kpis,
            "quality_score": quality_score,
            "recommendations": recommendations,
            "correlations": correlations,
            "sheet_names": [], # Not applicable for merged
            "active_sheet": None
        }

    except Exception as e:
        print(f"Error merging files: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/predict")
async def predict_endpoint(payload: dict):
    try:
        result = train_and_predict(payload)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/analyze/correlation")
async def analyze_correlation(payload: dict):
    try:
        data = payload.get('data')
        method = payload.get('method', 'pearson')
        if not data:
             return {"error": "Missing data"}
             
        df = pd.DataFrame(data)
        correlations = calculate_advanced_correlations(df)
        return correlations
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/analyze/heatmap")
async def analyze_heatmap(payload: dict):
    try:
        data = payload.get('data')
        if not data:
             return {"error": "Missing data"}
             
        df = pd.DataFrame(data)
        correlations = calculate_advanced_correlations(df)
        return correlations
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/compare")
async def compare_endpoint(payload: dict):
    try:
        data1 = payload.get('data1')
        data2 = payload.get('data2')
        name1 = payload.get('name1', 'Dataset 1')
        name2 = payload.get('name2', 'Dataset 2')
        
        if not data1 or not data2:
            raise HTTPException(status_code=400, detail="Missing datasets for comparison")
            
        df1 = pd.DataFrame(data1)
        df2 = pd.DataFrame(data2)
        
        result = compare_datasets(df1, df2, name1, name2)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/chat")
async def chat_endpoint(payload: dict):
    try:
        data = payload.get('data')
        message = payload.get('message', '').lower()
        stats = payload.get('stats', [])
        
        if not data or not message:
            return {"reply": "I need some data and a question to help you!"}
            
        df = pd.DataFrame(data)
        
        # Simple rule-based "AI" logic
        if 'average' in message or 'mean' in message:
            numeric_stats = [s for s in stats if s.get('type') == 'numeric']
            if not numeric_stats:
                return {"reply": "I couldn't find any numeric columns to calculate averages."}
            
            replies = []
            for s in numeric_stats[:3]:
                replies.append(f"The average of {s['name']} is {s['mean']:.2f}.")
            return {"reply": "Based on the data: " + " ".join(replies)}
            
        if 'anomaly' in message or 'outlier' in message or 'wrong' in message:
            anomalies = detect_anomalies(df)
            if not anomalies:
                return {"reply": "The data looks clean! I found no significant anomalies."}
            return {"reply": f"I found some potential issues: {', '.join(anomalies[:2])}"}
            
        if 'row' in message or 'size' in message or 'many' in message:
            return {"reply": f"This dataset has {len(df)} rows and {len(df.columns)} columns."}
            
        if 'recommend' in message or 'suggestion' in message or 'improve' in message:
            recs = generate_recommendations(df)
            if not recs:
                return {"reply": "Your data is in great shape! No specific recommendations at this time."}
            return {"reply": f"Here is a suggestion: {recs[0]}"}

        return {"reply": "That's an interesting question! I can help you with averages, anomalies, data size, or recommendations. What would you like to know?"}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/merge")
async def merge_files(payload: dict):
    try:
        data1 = payload.get('data1')
        data2 = payload.get('data2')
        merge_key = payload.get('merge_key')
        how = payload.get('how', 'inner')
        filename1 = payload.get('filename1', 'file1')
        filename2 = payload.get('filename2', 'file2')

        if not data1 or not data2 or not merge_key:
             raise HTTPException(status_code=400, detail="Missing data or merge key")
             
        merged_df, stats = merge_datasets(data1, data2, merge_key, how)
        
        # Smart Analysis on Merged Data
        domain = detect_domain(merged_df)
        anomalies = detect_anomalies(merged_df)
        summary = generate_summary(merged_df, stats, domain)
        kpis = generate_kpis(merged_df, domain)
        
        new_filename = f"Merged_{filename1}_{filename2}.csv"
        
        return {
            "filename": new_filename,
            "rows": len(merged_df),
            "columns": list(merged_df.columns),
            "stats": stats,
            "data": merged_df.to_dict(orient="records"),
            "domain": domain,
            "anomalies": anomalies,
            "summary": summary,
            "kpis": kpis
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/send-report")
async def send_report(request: dict):
    """
    Send report via email using SMTP
    """
    try:
        from email_utils import send_email, create_report_email
        recipient_email = request.get("email")
        message = request.get("message", "")
        report_data = request.get("reportData", {})
        if not recipient_email:
            raise HTTPException(status_code=400, detail="Email address is required")
        dataset_name = report_data.get('filename', 'Unknown Dataset')
        # Create email content
        plain_text, html = create_report_email(
            recipient_name=recipient_email.split('@')[0],
            dataset_name=dataset_name,
            custom_message=message
        )
        # Send email
        try:
            await send_email(
                to_email=recipient_email,
                subject=f"📊 Data Analysis Report: {dataset_name}",
                body=plain_text,
                html_body=html
            )
            
            print(f"✅ Email sent successfully to: {recipient_email}")
            
            return {
                "success": True,
                "message": f"Report sent to {recipient_email}"
            }
            
        except ValueError as ve:
            # SMTP not configured - fall back to simulation
            print(f"⚠️ SMTP not configured: {str(ve)}")
            print(f"📧 Simulated email to: {recipient_email}")
            print(f"📝 Message: {message}")
            print(f"📊 Report: {dataset_name}")
            
            return {
                "success": True,
                "message": f"Report sent to {recipient_email}",
                "note": "Email simulation - configure SMTP in .env for real sending"
            }
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
