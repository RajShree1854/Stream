from Backend.logger import LOGGER 
from Backend.helper.database import Database
from time import time
from datetime import datetime
import pytz


__version__ = "2.0.4"
StartTime = time()
timezone = pytz.timezone("Asia/Kolkata")
now = datetime.now(timezone)
USE_DEFAULT_ID: str = None  # or Optional[str]

db = Database()  
