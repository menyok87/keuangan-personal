import React, { useEffect, useState } from 'react';
import {
  SafeAreaProvider,
  SafeAreaView,
} from 'react-native-safe-area-context';
import {
  StatusBar,
  StyleSheet,
  useColorScheme,
  View,
  Text,
  ActivityIndicator,
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Provider as PaperProvider, DefaultTheme, MD3DarkTheme } from 'react-native-paper';

// Import screens
import AuthScreen from './src/screens/AuthScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import TransactionScreen from './src/screens/TransactionScreen';
import BudgetScreen from './src/screens/BudgetScreen';
import GoalsScreen from './src/screens/GoalsScreen';
import DebtScreen from './src/screens/DebtScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import AddTransactionScreen from './src/screens/AddTransactionScreen';

// Import hooks and utils
import { useAuth } from './src/hooks/useAuth';
import { supabase } from './src/lib/supabase';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Custom theme colors
const lightTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#3B82F6',
    secondary: '#6366F1',
    surface: '#FFFFFF',
    background: '#F8FAFC',
  },
};

const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#60A5FA',
    secondary: '#818CF8',
    surface: '#1F2937',
    background: '#111827',
  },
};

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          switch (route.name) {
            case 'Dashboard':
              iconName = 'dashboard';
              break;
            case 'Transaksi':
              iconName = 'receipt';
              break;
            case 'Anggaran':
              iconName = 'account-balance-wallet';
              break;
            case 'Target':
              iconName = 'flag';
              break;
            case 'Hutang':
              iconName = 'credit-card';
              break;
            case 'Profil':
              iconName = 'person';
              break;
            default:
              iconName = 'circle';
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#3B82F6',
        tabBarInactiveTintColor: '#6B7280',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E5E7EB',
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
        headerStyle: {
          backgroundColor: '#3B82F6',
        },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      })}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={DashboardScreen}
        options={{ title: 'Dashboard' }}
      />
      <Tab.Screen 
        name="Transaksi" 
        component={TransactionScreen}
        options={{ title: 'Transaksi' }}
      />
      <Tab.Screen 
        name="Anggaran" 
        component={BudgetScreen}
        options={{ title: 'Anggaran' }}
      />
      <Tab.Screen 
        name="Target" 
        component={GoalsScreen}
        options={{ title: 'Target' }}
      />
      <Tab.Screen 
        name="Hutang" 
        component={DebtScreen}
        options={{ title: 'Hutang' }}
      />
      <Tab.Screen 
        name="Profil" 
        component={ProfileScreen}
        options={{ title: 'Profil' }}
      />
    </Tab.Navigator>
  );
}

function AppNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Memuat Aplikasi...</Text>
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {user ? (
        <>
          <Stack.Screen name="Main" component={TabNavigator} />
          <Stack.Screen 
            name="AddTransaction" 
            component={AddTransactionScreen}
            options={{
              headerShown: true,
              title: 'Tambah Transaksi',
              headerStyle: { backgroundColor: '#3B82F6' },
              headerTintColor: '#FFFFFF',
            }}
          />
        </>
      ) : (
        <Stack.Screen name="Auth" component={AuthScreen} />
      )}
    </Stack.Navigator>
  );
}

function App(): JSX.Element {
  const isDarkMode = useColorScheme() === 'dark';
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Initialize app
    const initializeApp = async () => {
      try {
        // Initialize Supabase session
        await supabase.auth.getSession();
        setIsReady(true);
      } catch (error) {
        console.error('Error initializing app:', error);
        setIsReady(true);
      }
    };

    initializeApp();
  }, []);

  if (!isReady) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Memuat Aplikasi...</Text>
      </View>
    );
  }

  return (
    <PaperProvider theme={isDarkMode ? darkTheme : lightTheme}>
      <SafeAreaProvider>
        <StatusBar
          barStyle={isDarkMode ? 'light-content' : 'dark-content'}
          backgroundColor={isDarkMode ? '#111827' : '#3B82F6'}
        />
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>
      </SafeAreaProvider>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
});

export default App;