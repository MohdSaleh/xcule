import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LinearRegression
from datetime import datetime, timedelta

import time
from datetime import datetime, timedelta

def date_to_timestamp(date_str):
    date_obj = datetime.strptime(date_str, '%b %d, %Y')
    date_obj += timedelta(hours=5, minutes=30) # Add 5 hours 30 minutes for IST time
    return int(time.mktime(date_obj.timetuple()))

def convert_to_float(df):
    df["Close"] = df["Close"].str.replace(',', '').astype(float)
    df["Open"] = df["Open"].str.replace(',', '').astype(float)
    df["High"] = df["High"].str.replace(',', '').astype(float)
    df["Low"] = df["Low"].str.replace(',', '').astype(float)
    return df

# Load data
df = pd.read_csv('btc-1d.csv')

# Convert date column to Unix timestamps
df['Timestamp'] = df['Date'].apply(date_to_timestamp)
df['Close'] = df['Price']

# Drop the original date column
df.drop('Date', axis=1, inplace=True)
df.drop('Vol.', axis=1, inplace=True)
df.drop('Change %', axis=1, inplace=True)
df.drop('Price', axis=1, inplace=True)

df = convert_to_float(df)

print(df.head())

# Split the data into training and testing sets
X = df[['Timestamp', 'Open']]
y = df[['High', 'Low', 'Close']]
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Train the model
model = LinearRegression()
model.fit(X_train, y_train)

# Evaluate the model on training set
train_accuracy = model.score(X_train, y_train)
print("Training accuracy:", train_accuracy)

# Evaluate the model on testing set
test_accuracy = model.score(X_test, y_test)
print("Testing accuracy:", test_accuracy)


# Define a timestamp for the upcoming data point
last_row = df.tail(1)
# upcoming_time = datetime.fromtimestamp(last_row['Timestamp']) + timedelta(minutes=1)

# Get the Open value for the upcoming data point
# upcoming_open = last_row['Close'].values[0]

# Create a new DataFrame with the upcoming timestamp and Open value
# upcoming_data = pd.DataFrame({
#     'Timestamp': ['1679549400'],
#     'Open': ['27250.97']
# })
#
# print(upcoming_data)
# print(int(upcoming_data['Timestamp']))
#
# # Use the trained model to predict the High, Low, and Close values for the upcoming data point
# upcoming_values = model.predict(upcoming_data[['Timestamp', 'Open']])[0]
#
# # Extract the predicted High, Low, and Close values from the predicted values
# upcoming_high, upcoming_low, upcoming_close = upcoming_values
#
# # Print the predicted High, Low, and Close values for the upcoming data point
# print("Predicted High value:", upcoming_high)
# print("Predicted Low value:", upcoming_low)
# print("Predicted Close value:", upcoming_close)


# Define the upcoming data points
upcoming_data = pd.DataFrame({
    'Timestamp': ['1679549400', '1679635800', '1679722200', '1679808600', '1679895000', '1679981400', '1680067800',
                  '1680154200', '1680240600', '1680327000'],
    'Open': ['27250.97'] * 10
})

# Loop through the upcoming data points and make predictions for each one
for i in range(len(upcoming_data)):
    # Get the current upcoming data point
    current_data = upcoming_data.iloc[[i]]

    # Convert the Timestamp to an integer
    current_data['Timestamp'] = int(current_data['Timestamp'])

    # Replace the Open value with the predicted Close value from the previous data point
    if i > 0:
        current_data.loc[:, 'Open'] = predicted_close

    # Use the trained model to predict the High, Low, and Close values for the current data point
    predicted_values = model.predict(current_data[['Timestamp', 'Open']])[0]

    # Extract the predicted High, Low, and Close values from the predicted values
    predicted_high, predicted_low, predicted_close = predicted_values

    # Print the predicted High, Low, and Close values for the current data point
    print(f"Predicted values for data point {i + 1}:")
    print("Predicted High value:", predicted_high)
    print("Predicted Low value:", predicted_low)
    print("Predicted Close value:", predicted_close)

#
# import pandas as pd
# from sklearn.model_selection import train_test_split
# from sklearn.preprocessing import StandardScaler
# from sklearn.ensemble import GradientBoostingRegressor
# from sklearn.metrics import mean_absolute_error, mean_squared_error
#
# # Load data from CSV file
# df = pd.read_csv('btc_1_min.csv')
#
# # Convert 'Datetime' column to datetime format
# # df['Timestamp'] = pd.to_datetime(df['Timestamp'])
#
# # Set 'Datetime' column as the index of the DataFrame
# # df.set_index('Timestamp', inplace=True)
#
# # Display the first few rows of the DataFrame
# # print(df.head())
#
# # Split data into features and target
# X = df[['Timestamp']]
# y = df['Close']
#
# # Scale the features using StandardScaler
# scaler = StandardScaler()
# X_scaled = scaler.fit_transform(X)
#
# # Split the data into training and testing sets
# X_train, X_test, y_train, y_test = train_test_split(X_scaled, y, test_size=0.2, random_state=42)
#
# # Display the shapes of the training and testing sets
# print('X_train shape:', X_train.shape)
# print('X_test shape:', X_test.shape)
# print('y_train shape:', y_train.shape)
# print('y_test shape:', y_test.shape)
#
# # Create a gradient boosting model
# gb_model = GradientBoostingRegressor()
#
# # Fit the model to the training data
# gb_model.fit(X_train, y_train)
#
# # Predict on the test data
# y_pred = gb_model.predict(X_test)
#
# # Calculate the mean absolute error
# mae = mean_absolute_error(y_test, y_pred)
#
# # Calculate the mean squared error
# mse = mean_squared_error(y_test, y_pred)
#
# # Calculate the root mean squared error
# rmse = mean_squared_error(y_test, y_pred, squared=False)
#
# # Print the evaluation metrics
# print('Mean Absolute Error:', mae)
# print('Mean Squared Error:', mse)
# print('Root Mean Squared Error:', rmse)
#
