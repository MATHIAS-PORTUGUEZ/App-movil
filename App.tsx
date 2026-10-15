import { StatusBar } from 'expo-status-bar';
import { useMemo } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  View,
} from 'react-native';
import {
  SafeAreaProvider,
  SafeAreaView,
} from 'react-native-safe-area-context';
import './global.css';
import { BarberShopService } from './src/application/BarberShopService';
import { InMemoryRequestRepository } from './src/infrastructure/repositories/InMemoryRequestRepository';
import { useBarberShop } from './src/presentation/useBarberShop';
import { HomeScreen } from './src/screens/HomeScreen';
import { LoginScreen } from './src/screens/LoginScreen';
import { RegisterScreen } from './src/screens/RegisterScreen';

export default function App() {
  const service = useMemo(
    () => new BarberShopService(new InMemoryRequestRepository()),
    [],
  );
  const barberShop = useBarberShop(service);

  return (
    <SafeAreaProvider>
      <SafeAreaView
        className="flex-1 bg-[#0026ff]"
        edges={['top', 'bottom']}
      >
        <StatusBar style="light" />
        <KeyboardAvoidingView
          className="flex-1"
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
        <ScrollView
          contentContainerClassName="grow"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="w-full max-w-[720px] flex-1 self-center px-5">
            {barberShop.screen === 'login' ? (
              <LoginScreen
                username={barberShop.username}
                password={barberShop.password}
                errors={barberShop.loginErrors}
                onUsernameChange={barberShop.updateUsername}
                onPasswordChange={barberShop.updatePassword}
                onSignIn={barberShop.signIn}
              />
            ) : (
              <View className="min-h-[760px] flex-1 pb-[34px]">
                {barberShop.screen === 'home' ? (
                  <HomeScreen
                    username={barberShop.username}
                    onRegister={barberShop.showRegister}
                    onLogout={barberShop.signOut}
                  />
                ) : null}

                {barberShop.screen === 'register' ? (
                  <RegisterScreen
                    form={barberShop.form}
                    errors={barberShop.formErrors}
                    isSubmitting={barberShop.isSubmitting}
                    onChange={barberShop.updateForm}
                    onSubmit={barberShop.submitRequest}
                    onBack={barberShop.showHome}
                  />
                ) : null}
              </View>
            )}
          </View>
        </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
