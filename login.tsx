import { ScrollView, Text, View, TextInput, Pressable, Alert } from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { trpc } from "@/lib/trpc";
import * as Auth from "@/lib/_core/auth";
import * as Api from "@/lib/_core/api";
import { useAuth } from "@/hooks/use-auth";
import { Platform } from "react-native";

export default function LoginScreen() {
  const router = useRouter();
  const { refresh } = useAuth();
  const [email, setEmail] = useState("admin@condominio.com");
  const [password, setPassword] = useState("admin123");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const loginMutation = trpc.authCustom.login.useMutation();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Erro", "Por favor, preencha todos os campos");
      return;
    }

    try {
      setLoading(true);

      const result = await loginMutation.mutateAsync({
        email,
        password,
      });

      if (result.success && result.user && result.sessionToken) {
        // Store session token (for native)
        await Auth.setSessionToken(result.sessionToken);

        // Store user info locally
        const userInfo: Auth.User = {
          id: result.user.id,
          openId: result.user.openId,
          name: result.user.name,
          email: result.user.email,
          loginMethod: result.user.loginMethod,
          role: result.user.role as "admin" | "user" | undefined,
          lastSignedIn: new Date(),
        };
        await Auth.setUserInfo(userInfo);

        // For web: establish session cookie on the backend domain
        if (Platform.OS === "web") {
          await Api.establishSession(result.sessionToken);
        }

        // Refresh auth state
        await refresh();

        // Navigate to home
        router.replace("/(tabs)");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro ao fazer login";
      Alert.alert("Erro de Login", message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = () => {
    router.push("/register");
  };

  return (
    <ScreenContainer className="p-4" containerClassName="bg-background">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        <View className="flex-1 justify-center gap-6">
          {/* Logo / Header */}
          <View className="items-center gap-2 mb-4">
            <Text className="text-4xl font-bold text-primary">🏘️</Text>
            <Text className="text-3xl font-bold text-foreground">Gestão de Condomínio</Text>
            <Text className="text-sm text-muted text-center">
              Gerencie seu condomínio de rua com facilidade
            </Text>
          </View>

          {/* Login Form */}
          <View className="gap-4">
            {/* Email Input */}
            <View className="gap-2">
              <Text className="text-sm font-semibold text-foreground">Email</Text>
              <TextInput
                placeholder="seu@email.com"
                placeholderTextColor="#687076"
                value={email}
                onChangeText={setEmail}
                editable={!loading}
                keyboardType="email-address"
                autoCapitalize="none"
                className="bg-surface border border-border rounded-lg px-4 py-3 text-foreground"
              />
              <Text className="text-xs text-muted">Demo: admin@condominio.com</Text>
            </View>

            {/* Password Input */}
            <View className="gap-2">
              <Text className="text-sm font-semibold text-foreground">Senha</Text>
              <View className="flex-row items-center bg-surface border border-border rounded-lg px-4 py-3">
                <TextInput
                  placeholder="••••••••"
                  placeholderTextColor="#687076"
                  value={password}
                  onChangeText={setPassword}
                  editable={!loading}
                  secureTextEntry={!showPassword}
                  className="flex-1 text-foreground"
                />
                <Pressable onPress={() => setShowPassword(!showPassword)}>
                  <Text className="text-primary text-sm font-semibold">
                    {showPassword ? "Ocultar" : "Mostrar"}
                  </Text>
                </Pressable>
              </View>
              <Text className="text-xs text-muted">Demo: admin123</Text>
            </View>

            {/* Forgot Password Link */}
            <Pressable>
              <Text className="text-sm text-primary font-semibold text-right">
                Esqueceu a senha?
              </Text>
            </Pressable>

            {/* Login Button */}
            <Pressable
              onPress={handleLogin}
              disabled={loading}
              style={({ pressed }) => [
                {
                  backgroundColor: loading ? "#A0A0A0" : "#0a7ea4",
                  paddingVertical: 14,
                  paddingHorizontal: 16,
                  borderRadius: 8,
                  opacity: pressed && !loading ? 0.8 : 1,
                },
              ]}
            >
              <Text className="text-white text-center font-bold text-base">
                {loading ? "Entrando..." : "Entrar"}
              </Text>
            </Pressable>
          </View>

          {/* Divider */}
          <View className="flex-row items-center gap-3">
            <View className="flex-1 h-px bg-border" />
            <Text className="text-sm text-muted">ou</Text>
            <View className="flex-1 h-px bg-border" />
          </View>

          {/* Demo Accounts */}
          <View className="bg-surface rounded-lg p-4 border border-border gap-3">
            <Text className="text-sm font-semibold text-foreground">Contas de Demonstração</Text>

            <Pressable
              onPress={() => {
                setEmail("admin@condominio.com");
                setPassword("admin123");
              }}
              style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
            >
              <View className="bg-primary rounded p-4 border border-primary">
                <Text className="text-base font-bold text-background">👨‍💼 Administrador</Text>
                <Text className="text-xs text-background opacity-90 mt-1">Painel de controle completo</Text>
                <Text className="text-xs text-background opacity-75 mt-2">admin@condominio.com</Text>
              </View>
            </Pressable>

            <Pressable
              onPress={() => {
                setEmail("morador@condominio.com");
                setPassword("morador123");
              }}
              style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
            >
              <View className="bg-surface rounded p-4 border border-border">
                <Text className="text-base font-bold text-foreground">👤 Morador</Text>
                <Text className="text-xs text-muted mt-1">Acesso ao seu perfil</Text>
                <Text className="text-xs text-muted opacity-75 mt-2">morador@condominio.com</Text>
              </View>
            </Pressable>
          </View>

          {/* Register Link */}
          <View className="flex-row justify-center gap-1">
            <Text className="text-sm text-muted">Não tem conta?</Text>
            <Pressable onPress={handleRegister}>
              <Text className="text-sm text-primary font-semibold">Registre-se aqui</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
