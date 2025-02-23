## How to Check the OPENWEATHER_API_KEY Environment Variable in Windows

1.  **Open System Properties:**
    *   Press the `Windows key + R` to open the Run dialog.
    *   Type `sysdm.cpl` and press Enter. This will open the System Properties window.

2.  **Navigate to Environment Variables:**
    *   In the System Properties window, go to the "Advanced" tab.
    *   Click the "Environment Variables..." button.

3.  **Check User Variables and System Variables:**
    *   In the Environment Variables window, you will see two sections: "User variables for \[Your User Name]" and "System variables".
    *   Look for a variable named `OPENWEATHER_API_KEY` in both sections.

4.  **If the Variable Exists:**
    *   Select the `OPENWEATHER_API_KEY` variable and click "Edit..." to view its value.
    *   Verify that the value is correct and matches your OpenWeather API key.

5.  **If the Variable Does Not Exist:**
    *   If you cannot find the `OPENWEATHER_API_KEY` variable, it means it is not set. You will need to create it.

## Setting the OPENWEATHER_API_KEY Environment Variable (If it doesn't exist)

1.  **Open System Properties:**
    *   Follow steps 1 and 2 above to open the Environment Variables window.

2.  **Create a New Variable:**
    *   In the "User variables" section, click "New...".
    *   Enter `OPENWEATHER_API_KEY` as the "Variable name".
    *   Enter your OpenWeather API key as the "Variable value".
    *   Click "OK" to save the new variable.

3.  **Apply Changes:**
    *   Click "OK" on all open windows to close them and apply the changes.

4.  **Restart Your Terminal/IDE:**
    *   For the changes to take effect, you may need to restart your terminal or IDE.

After following these steps, please try running the application again to see if the issue is resolved.