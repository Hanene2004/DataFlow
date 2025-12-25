import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from aiosmtplib import SMTP
from email_validator import validate_email, EmailNotValidError

# Email configuration from environment variables
SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
EMAIL_FROM = os.getenv("EMAIL_FROM", SMTP_USER)
EMAIL_FROM_NAME = os.getenv("EMAIL_FROM_NAME", "MultiHub Analytics")

async def send_email(to_email: str, subject: str, body: str, html_body: str = None):
    """
    Send an email using SMTP
    """
    try:
        # Validate email
        try:
            valid = validate_email(to_email)
            to_email = valid.email
        except EmailNotValidError as e:
            raise ValueError(f"Invalid email address: {str(e)}")
        
        # Check if SMTP is configured
        if not SMTP_USER or not SMTP_PASSWORD:
            raise ValueError("SMTP credentials not configured. Please set SMTP_USER and SMTP_PASSWORD in .env file")
        
        # Create message
        message = MIMEMultipart("alternative")
        message["From"] = f"{EMAIL_FROM_NAME} <{EMAIL_FROM}>"
        message["To"] = to_email
        message["Subject"] = subject
        
        # Add plain text version
        text_part = MIMEText(body, "plain")
        message.attach(text_part)
        
        # Add HTML version if provided
        if html_body:
            html_part = MIMEText(html_body, "html")
            message.attach(html_part)
        
        # Send email
        async with SMTP(hostname=SMTP_HOST, port=SMTP_PORT, use_tls=False) as smtp:
            await smtp.connect()
            await smtp.starttls()
            await smtp.login(SMTP_USER, SMTP_PASSWORD)
            await smtp.send_message(message)
        
        return True
        
    except Exception as e:
        print(f"❌ Email sending failed: {str(e)}")
        raise

def create_report_email(recipient_name: str, dataset_name: str, custom_message: str = ""):
    """
    Create HTML email template for report sharing
    """
    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
            .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
            .content {{ background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }}
            .button {{ display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }}
            .footer {{ text-align: center; margin-top: 30px; color: #666; font-size: 12px; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>📊 MultiHub Analytics Report</h1>
            </div>
            <div class="content">
                <p>Hello,</p>
                <p>You have received a data analysis report for: <strong>{dataset_name}</strong></p>
                
                {f'<p><em>Message from sender:</em><br>"{custom_message}"</p>' if custom_message else ''}
                
                <p>This report contains comprehensive analysis including:</p>
                <ul>
                    <li>📈 Statistical summaries</li>
                    <li>🔍 Data quality insights</li>
                    <li>💡 AI-powered recommendations</li>
                    <li>📊 Visualizations and trends</li>
                </ul>
                
                <p>Thank you for using MultiHub Analytics!</p>
            </div>
            <div class="footer">
                <p>This email was sent from MultiHub Analytics Platform</p>
                <p>© 2024 MultiHub. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    plain_text = f"""
    MultiHub Analytics Report
    
    You have received a data analysis report for: {dataset_name}
    
    {f'Message from sender: {custom_message}' if custom_message else ''}
    
    This report contains comprehensive analysis including statistical summaries, data quality insights, AI-powered recommendations, and visualizations.
    
    Thank you for using MultiHub Analytics!
    """
    
    return plain_text, html
