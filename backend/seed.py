import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "sohoj_pay.settings")
django.setup()

from django.contrib.auth.models import User
from core.models import Contact, Transaction

def seed():
    try:
        user = User.objects.get(username="user")
    except User.DoesNotExist:
        print("User 'user' does not exist")
        return

    # Seed Contacts
    if not Contact.objects.filter(user=user).exists():
        contacts = [
            {"name": "করিম স্টোর", "number": "01711223344", "type": "Agent", "avatar": "🏪"},
            {"name": "Rahim", "number": "01811223344", "type": "Personal", "avatar": "👨"},
            {"name": "সালাম টেলিকম", "number": "01911223344", "type": "Agent", "avatar": "📱"},
            {"name": "Mina", "number": "01511223344", "type": "Personal", "avatar": "👩"},
        ]
        for c in contacts:
            Contact.objects.create(user=user, name=c["name"], number=c["number"], type=c["type"], avatar=c["avatar"])
        print("Contacts seeded.")
    else:
        print("Contacts already exist.")

    # Seed Transactions
    if not Transaction.objects.filter(user=user).exists():
        transactions = [
            {"type": "Send Money", "amount": "500", "recipient": "Rahim", "date": "Today, 10:30 AM", "status": "Success", "icon": "transfer", "color": "blue"},
            {"type": "Cash Out", "amount": "2,000", "recipient": "করিম স্টোর", "date": "Yesterday", "status": "Success", "icon": "download", "color": "peach"},
            {"type": "Mobile Recharge", "amount": "50", "recipient": "01711223344", "date": "10 Apr 2025", "status": "Success", "icon": "phone", "color": "cream"},
        ]
        for t in transactions:
            Transaction.objects.create(user=user, type=t["type"], amount=t["amount"], recipient=t["recipient"], date=t["date"], status=t["status"], icon=t["icon"], color=t["color"])
        print("Transactions seeded.")
    else:
        print("Transactions already exist.")

if __name__ == "__main__":
    seed()
