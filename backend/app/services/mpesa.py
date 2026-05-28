import requests
import base64
from datetime import datetime
from ..config import get_settings

settings = get_settings()

def get_mpesa_access_token():
    url = "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials"
    auth = base64.b64encode(f"{settings.MPESA_CONSUMER_KEY}:{settings.MPESA_CONSUMER_SECRET}".encode()).decode()
    
    headers = {"Authorization": f"Basic {auth}"}
    response = requests.get(url, headers=headers)
    
    if response.status_code == 200:
        return response.json()["access_token"]
    raise Exception("Failed to get M-Pesa access token")

def initiate_mpesa_payment(phone_number: str, amount: float, transaction_id: str):
    """
    Simulated M-Pesa STK Push. In production, use real Daraja API.
    """
    # For simulation purposes, return success response
    # In production, uncomment below and configure properly
    
    # access_token = get_mpesa_access_token()
    # timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    # password = base64.b64encode(
    #     f"{settings.MPESA_SHORTCODE}{settings.MPESA_PASSKEY}{timestamp}".encode()
    # ).decode()
    
    # url = "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest"
    # headers = {"Authorization": f"Bearer {access_token}", "Content-Type": "application/json"}
    # payload = {
    #     "BusinessShortCode": settings.MPESA_SHORTCODE,
    #     "Password": password,
    #     "Timestamp": timestamp,
    #     "TransactionType": "CustomerPayBillOnline",
    #     "Amount": int(amount),
    #     "PartyA": phone_number,
    #     "PartyB": settings.MPESA_SHORTCODE,
    #     "PhoneNumber": phone_number,
    #     "CallBackURL": f"https://yourdomain.com/api/payments/mpesa/callback/{transaction_id}",
    #     "AccountReference": transaction_id,
    #     "TransactionDesc": "Payment for order"
    # }
    
    # response = requests.post(url, json=payload, headers=headers)
    # return response.json()
    
    # Simulation response
    return {
        "MerchantRequestID": "simulated",
        "CheckoutRequestID": "simulated",
        "ResponseCode": "0",
        "ResponseDescription": "Success. Request accepted for processing",
        "CustomerMessage": "Success. Request accepted for processing"
    }

def query_mpesa_transaction(checkout_request_id: str):
    access_token = get_mpesa_access_token()
    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    password = base64.b64encode(
        f"{settings.MPESA_SHORTCODE}{settings.MPESA_PASSKEY}{timestamp}".encode()
    ).decode()
    
    url = "https://sandbox.safaricom.co.ke/mpesa/stkpushquery/v1/query"
    headers = {"Authorization": f"Bearer {access_token}", "Content-Type": "application/json"}
    payload = {
        "BusinessShortCode": settings.MPESA_SHORTCODE,
        "Password": password,
        "Timestamp": timestamp,
        "CheckoutRequestID": checkout_request_id
    }
    
    response = requests.post(url, json=payload, headers=headers)
    return response.json()