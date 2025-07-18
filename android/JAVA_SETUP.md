# 🔧 Java Setup Guide for Android Development

## ❌ Error: JAVA_HOME is not set

This error occurs because Android development requires Java Development Kit (JDK) to be installed and properly configured.

## 🛠️ Solution Steps

### **Windows:**

1. **Download and Install JDK 17:**
   - Download from: https://adoptium.net/temurin/releases/
   - Choose JDK 17 (LTS) for Windows x64
   - Run the installer and follow the setup wizard

2. **Set JAVA_HOME Environment Variable:**
   ```cmd
   # Open Command Prompt as Administrator
   setx JAVA_HOME "C:\Program Files\Eclipse Adoptium\jdk-17.0.9.9-hotspot"
   setx PATH "%PATH%;%JAVA_HOME%\bin"
   ```

3. **Alternative: Set via System Properties:**
   - Right-click "This PC" → Properties
   - Click "Advanced system settings"
   - Click "Environment Variables"
   - Under "System Variables", click "New"
   - Variable name: `JAVA_HOME`
   - Variable value: `C:\Program Files\Eclipse Adoptium\jdk-17.0.9.9-hotspot`
   - Edit PATH variable and add: `%JAVA_HOME%\bin`

### **macOS:**

1. **Install JDK 17 via Homebrew:**
   ```bash
   brew install openjdk@17
   ```

2. **Set JAVA_HOME in your shell profile:**
   ```bash
   # For Zsh (default on macOS)
   echo 'export JAVA_HOME=$(/usr/libexec/java_home -v 17)' >> ~/.zshrc
   echo 'export PATH=$JAVA_HOME/bin:$PATH' >> ~/.zshrc
   source ~/.zshrc
   
   # For Bash
   echo 'export JAVA_HOME=$(/usr/libexec/java_home -v 17)' >> ~/.bash_profile
   echo 'export PATH=$JAVA_HOME/bin:$PATH' >> ~/.bash_profile
   source ~/.bash_profile
   ```

### **Linux (Ubuntu/Debian):**

1. **Install OpenJDK 17:**
   ```bash
   sudo apt update
   sudo apt install openjdk-17-jdk
   ```

2. **Set JAVA_HOME:**
   ```bash
   # Add to ~/.bashrc or ~/.zshrc
   echo 'export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64' >> ~/.bashrc
   echo 'export PATH=$JAVA_HOME/bin:$PATH' >> ~/.bashrc
   source ~/.bashrc
   ```

## ✅ Verify Installation

After setting up, verify your Java installation:

```bash
# Check Java version
java -version

# Check JAVA_HOME
echo $JAVA_HOME

# Check if javac is available
javac -version
```

**Expected output:**
```
openjdk version "17.0.9" 2023-10-17
OpenJDK Runtime Environment Temurin-17.0.9+9 (build 17.0.9+9)
OpenJDK 64-Bit Server VM Temurin-17.0.9+9 (build 17.0.9+9, mixed mode, sharing)
```

## 🚀 After Java Setup

1. **Restart your terminal/command prompt**
2. **Navigate to android folder:**
   ```bash
   cd android
   ```
3. **Try running the app again:**
   ```bash
   npm run android
   ```

## 🔍 Troubleshooting

### **If JAVA_HOME still not recognized:**

1. **Restart your computer** (Windows especially)
2. **Check the exact Java installation path:**
   ```bash
   # Windows
   dir "C:\Program Files\Eclipse Adoptium"
   
   # macOS
   /usr/libexec/java_home -V
   
   # Linux
   ls /usr/lib/jvm/
   ```

3. **Manually verify the path exists:**
   - Make sure the path in JAVA_HOME actually contains `bin/java`

### **Alternative Java Distributions:**

If Adoptium doesn't work, try:
- **Oracle JDK 17**: https://www.oracle.com/java/technologies/downloads/
- **Amazon Corretto 17**: https://aws.amazon.com/corretto/
- **Microsoft OpenJDK 17**: https://docs.microsoft.com/en-us/java/openjdk/

## 📱 Android Studio Alternative

If you have Android Studio installed:
1. Open Android Studio
2. Go to File → Project Structure → SDK Location
3. Copy the JDK location
4. Use that path for JAVA_HOME

## ⚠️ Important Notes

- **Use JDK 17** (recommended for React Native 0.73+)
- **Restart terminal** after setting environment variables
- **Use the full path** to the JDK installation directory
- **Don't include `/bin` in JAVA_HOME** (it should point to the JDK root)

After completing these steps, your Android development environment should be properly configured!