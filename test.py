import yfinance as yf

data = yf.download("AAPL", period="1y")
print(data.head())