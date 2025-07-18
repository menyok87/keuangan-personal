#!/bin/bash

# 🔧 Java Setup Script for Android Development
# This script helps set up Java for React Native Android development

echo "🚀 Setting up Java for Android Development..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Java is already installed
check_java() {
    if command -v java &> /dev/null; then
        JAVA_VERSION=$(java -version 2>&1 | head -n 1 | cut -d'"' -f2)
        print_success "Java is already installed: $JAVA_VERSION"
        
        if [[ -n "$JAVA_HOME" ]]; then
            print_success "JAVA_HOME is set: $JAVA_HOME"
            return 0
        else
            print_warning "JAVA_HOME is not set"
            return 1
        fi
    else
        print_error "Java is not installed"
        return 1
    fi
}

# Install Java on macOS
install_java_macos() {
    print_status "Installing Java on macOS..."
    
    if command -v brew &> /dev/null; then
        print_status "Installing OpenJDK 17 via Homebrew..."
        brew install openjdk@17
        
        # Set JAVA_HOME
        JAVA_HOME_PATH="$(brew --prefix openjdk@17)/libexec/openjdk.jdk/Contents/Home"
        
        # Add to shell profile
        if [[ "$SHELL" == *"zsh"* ]]; then
            echo "export JAVA_HOME=\"$JAVA_HOME_PATH\"" >> ~/.zshrc
            echo "export PATH=\"\$JAVA_HOME/bin:\$PATH\"" >> ~/.zshrc
            print_success "Added JAVA_HOME to ~/.zshrc"
        else
            echo "export JAVA_HOME=\"$JAVA_HOME_PATH\"" >> ~/.bash_profile
            echo "export PATH=\"\$JAVA_HOME/bin:\$PATH\"" >> ~/.bash_profile
            print_success "Added JAVA_HOME to ~/.bash_profile"
        fi
        
        export JAVA_HOME="$JAVA_HOME_PATH"
        export PATH="$JAVA_HOME/bin:$PATH"
        
    else
        print_error "Homebrew not found. Please install Homebrew first:"
        echo "  /bin/bash -c \"\$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)\""
        return 1
    fi
}

# Install Java on Linux
install_java_linux() {
    print_status "Installing Java on Linux..."
    
    if command -v apt &> /dev/null; then
        print_status "Installing OpenJDK 17 via apt..."
        sudo apt update
        sudo apt install -y openjdk-17-jdk
        
        # Set JAVA_HOME
        JAVA_HOME_PATH="/usr/lib/jvm/java-17-openjdk-amd64"
        
        echo "export JAVA_HOME=\"$JAVA_HOME_PATH\"" >> ~/.bashrc
        echo "export PATH=\"\$JAVA_HOME/bin:\$PATH\"" >> ~/.bashrc
        
        export JAVA_HOME="$JAVA_HOME_PATH"
        export PATH="$JAVA_HOME/bin:$PATH"
        
        print_success "Added JAVA_HOME to ~/.bashrc"
        
    elif command -v yum &> /dev/null; then
        print_status "Installing OpenJDK 17 via yum..."
        sudo yum install -y java-17-openjdk-devel
        
        JAVA_HOME_PATH="/usr/lib/jvm/java-17-openjdk"
        echo "export JAVA_HOME=\"$JAVA_HOME_PATH\"" >> ~/.bashrc
        echo "export PATH=\"\$JAVA_HOME/bin:\$PATH\"" >> ~/.bashrc
        
        export JAVA_HOME="$JAVA_HOME_PATH"
        export PATH="$JAVA_HOME/bin:$PATH"
        
    else
        print_error "Package manager not supported. Please install Java manually."
        return 1
    fi
}

# Main setup function
setup_java() {
    print_status "Checking current Java installation..."
    
    if check_java; then
        print_success "Java is properly configured!"
        return 0
    fi
    
    # Detect OS and install Java
    case "$(uname -s)" in
        Darwin*)
            install_java_macos
            ;;
        Linux*)
            install_java_linux
            ;;
        CYGWIN*|MINGW32*|MSYS*|MINGW*)
            print_error "Windows detected. Please install Java manually:"
            echo "  1. Download JDK 17 from: https://adoptium.net/temurin/releases/"
            echo "  2. Install and set JAVA_HOME environment variable"
            echo "  3. Add %JAVA_HOME%\\bin to your PATH"
            return 1
            ;;
        *)
            print_error "Unsupported operating system"
            return 1
            ;;
    esac
    
    # Verify installation
    print_status "Verifying Java installation..."
    
    if command -v java &> /dev/null; then
        JAVA_VERSION=$(java -version 2>&1 | head -n 1)
        print_success "Java installed successfully: $JAVA_VERSION"
        
        if [[ -n "$JAVA_HOME" ]]; then
            print_success "JAVA_HOME is set: $JAVA_HOME"
        else
            print_warning "JAVA_HOME might not be set in current session"
            print_status "Please restart your terminal or run: source ~/.bashrc (or ~/.zshrc)"
        fi
        
        return 0
    else
        print_error "Java installation failed"
        return 1
    fi
}

# Run setup
setup_java

if [[ $? -eq 0 ]]; then
    echo ""
    print_success "🎉 Java setup completed!"
    print_status "You can now run: npm run android"
    echo ""
    print_status "If you still get JAVA_HOME errors, please:"
    echo "  1. Restart your terminal"
    echo "  2. Run: source ~/.bashrc (Linux) or source ~/.zshrc (macOS)"
    echo "  3. Verify with: echo \$JAVA_HOME"
else
    echo ""
    print_error "❌ Java setup failed!"
    print_status "Please follow the manual installation guide in JAVA_SETUP.md"
fi