import { StatusBar } from 'expo-status-bar';
import { useMemo } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  View,
} from 'react-native';
import {
  SafeAreaProvider,
  SafeAreaView,
} from 'react-native-safe-area-context';
import './global.css';
import { BarberShopService } from './src/application/BarberShopService';
import { SQLiteProfileRepository } from './src/infrastructure/repositories/SQLiteProfileRepository';
import { SQLiteRequestRepository } from './src/infrastructure/repositories/SQLiteRequestRepository';
import { FirestoreRequestRepository } from './src/infrastructure/repositories/FirestoreRequestRepository';
import { SyncedRequestRepository } from './src/infrastructure/repositories/SyncedRequestRepository';
import { useBarberShop } from './src/presentation/useBarberShop';
import { CreateAccountScreen } from './src/presentation/screens/CreateAccountScreen';
import { HomeScreen } from './src/presentation/screens/HomeScreen';
import { LoginScreen } from './src/presentation/screens/LoginScreen';
import { RegisterScreen } from './src/presentation/screens/RegisterScreen';
import { ProfileScreen } from './src/presentation/screens/ProfileScreen';
import { CatalogManagementScreen } from './src/presentation/screens/CatalogManagementScreen';
import { FirestoreCatalogRepository } from './src/infrastructure/repositories/FirestoreCatalogRepository';

export default function App() {
  const service = useMemo(
    () =>
      new BarberShopService(
        new SyncedRequestRepository(
          new FirestoreRequestRepository(),
          new SQLiteRequestRepository(),
        ),
        new SQLiteProfileRepository(),
      ),
    [],
  );
  const catalogRepository = useMemo(() => new FirestoreCatalogRepository(), []);

  const barberShop = useBarberShop(service, catalogRepository);

  return (
    <SafeAreaProvider>
      <SafeAreaView
        className="flex-1 bg-[#1E2130]"
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
              {barberShop.isRestoringAuth ? (
                <View className="flex-1 items-center justify-center gap-3">
                  <ActivityIndicator color="#00BFFF" />
                  <Text className="text-sm text-white/75">Comprobando sesión…</Text>
                </View>
              ) : barberShop.screen === 'login' ? (
                <LoginScreen
                  email={barberShop.email}
                  password={barberShop.password}
                  errors={barberShop.loginErrors}
                  isSigningIn={barberShop.isSigningIn}
                  onEmailChange={barberShop.updateEmail}
                  onPasswordChange={barberShop.updatePassword}
                  onSignIn={barberShop.signIn}
                  onCreateAccount={barberShop.showCreateAccount}
                />
              ) : barberShop.screen === 'createAccount' ? (
                <CreateAccountScreen
                  form={barberShop.createAccountForm}
                  errors={barberShop.createAccountErrors}
                  isCreatingAccount={barberShop.isCreatingAccount}
                  onChange={barberShop.updateCreateAccountForm}
                  onCreateAccount={barberShop.createAccount}
                  onBackToLogin={barberShop.backToLogin}
                />
              ) : (
                <View className="min-h-[760px] flex-1 pb-[34px]">
                  {barberShop.screen === 'home' ? (
                    barberShop.profile ? (
                      <HomeScreen
                        profile={barberShop.profile}
                        form={barberShop.form}
                        errors={barberShop.formErrors}
                        onChange={barberShop.updateForm}
                        onSelectService={barberShop.selectService}
                        onSelectBarber={barberShop.selectBarber}
                        onSelectPromotion={barberShop.selectPromotion}
                        onRegister={barberShop.showRegister}
                        onOpenProfile={barberShop.showProfile}
                        services={barberShop.catalogs.services}
                        barbers={barberShop.catalogs.barbers}
                        promotions={barberShop.catalogs.promotions}
                        isCatalogAdmin={barberShop.isCatalogAdmin}
                        onManageBusiness={barberShop.showBusinessManagement}
                      />
                    ) : null
                  ) : null}

                  {barberShop.screen === 'register' ? (
                    <RegisterScreen
                      form={barberShop.form}
                      errors={barberShop.formErrors}
                      isSubmitting={barberShop.isSubmitting}
                      isEditingBooking={Boolean(barberShop.editingRequest)}
                      bookedTimes={barberShop.bookedTimes}
                      cancelableTimes={barberShop.cancelableTimes}
                      isLoadingAvailability={barberShop.isLoadingAvailability}
                      availabilityError={barberShop.availabilityError}
                      onRefreshAvailability={barberShop.refreshAvailability}
                      onCancelBooking={barberShop.cancelBooking}
                      onChange={barberShop.updateForm}
                      onSubmit={barberShop.submitRequest}
                      onBack={barberShop.backFromRegister}
                      promotions={barberShop.catalogs.promotions}
                    />
                  ) : null}

                  {barberShop.screen === 'profile' && barberShop.profile ? (
                    <ProfileScreen
                      profile={barberShop.profile}
                      requests={barberShop.profileRequests}
                      isLoadingRequests={barberShop.isLoadingProfileRequests}
                      onSave={barberShop.saveProfile}
                      onCancelBooking={(request) =>
                        barberShop.cancelBooking(
                          request.appointmentDate,
                          request.appointmentTime,
                        )
                      }
                      onEditBooking={barberShop.editBooking}
                      onBack={barberShop.showHome}
                      onLogout={barberShop.signOut}
                    />
                  ) : null}

                  {barberShop.screen === 'business' && barberShop.isCatalogAdmin ? (
                    <CatalogManagementScreen
                      repository={catalogRepository}
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
