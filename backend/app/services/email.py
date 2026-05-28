# Simulated email service
# In production, integrate with SendGrid, Mailgun, or AWS SES

def send_order_confirmation(email: str, order_id: int, total: float):
    """
    Simulated email sending. In production, use actual email service.
    """
    print(f"""
    ============================================
    EMAIL SENT TO: {email}
    SUBJECT: Order Confirmation - #{order_id}
    
    Dear Customer,
    
    Your order #{order_id} has been confirmed.
    Total Amount: KES {total:,.2f}
    
    Thank you for shopping with us!
    
    Kenya Marketplace Team
    ============================================
    """)
    return True

def send_welcome_email(email: str, name: str):
    print(f"""
    ============================================
    EMAIL SENT TO: {email}
    SUBJECT: Welcome to Kenya Marketplace
    
    Dear {name},
    
    Welcome to Kenya Marketplace! Start shopping now.
    
    Best regards,
    Kenya Marketplace Team
    ============================================
    """)
    return True