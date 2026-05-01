import { ScrollView, Text, View, TextInput, Pressable, Alert } from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { trpc } from "@/lib/trpc";

export default function RegisterScreen() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const registerMutation = trpc.authCustom.register.useMutation();

  const handleRegister = async () => {
    if (!name || !email || !password || !confirmPassword) {
      Alert.alert("Erro", "Por favor, preencha todos os campos");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Erro", "As senhas não coincidem");
      return;
    }

    if (password.length < 6) {
      Alert.alert("Erro", "A senha deve ter no mínimo 6 caracteres");
      return;
    }

    try {
      setLoading(true);

      await registerMutation.mutateAsync({
        name,
        email,
        password,
      });

      Alert.alert("Sucesso", "Conta criada com sucesso! Faça login agora.", [
        {
          text: "OK",
          onPress: () => router.replace("/login"),
        },
      ]);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro ao registrar";
      Alert.alert("Erro", message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer className="p-4" containerClassName="bg-background">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        <View className="flex-1 justify-center gap-6">
          {/* Header */}
          <View className="items-center gap-2 mb-4">
            <Text className="text-4xl font-bold text-primary">🏘️</Text>
            <Text className="text-3xl font-bold text-foreground">Criar Conta</Text>
            <Text className="text-sm text-muted text-center">
              Registre-se para gerenciar seu condomínio
            </Text>
          </View>

          {/* Register Form */}
          <View className="gap-4">
            {/* Name Input */}
            <View className="gap-2">
              <Text className="text-sm font-semibold text-foreground">Nome Completo</Text>
              <TextInput
                placeholder="João Silva"
                placeholderTextColor="#687076"
                value={name}
                onChangeText={setName}
                editable={!loading}
                className="bg-surface border border-border rounded-lg px-4 py-3 text-foreground"
              />
            </View>

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
            </View>

            {/* Confirm Password Input */}
            <View className="gap-2">
              <Text className="text-sm font-semibold text-foreground">Confirmar Senha</Text>
              <TextInput
                placeholder="••••••••"
                placeholderTextColor="#687076"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                editable={!loading}
                secureTextEntry={!showPassword}
                className="bg-surface border border-border rounded-lg px-4 py-3 text-foreground"
              />
            </View>

            {/* Register Button */}
            <Pressable
              onPress={handleRegister}
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
                {loading ? "Criando conta..." : "Criar Conta"}
              </Text>
            </Pressable>
          </View>

          {/* Login Link */}
          <View className="flex-row justify-center gap-1">
            <Text className="text-sm text-muted">Já tem conta?</Text>
            <Pressable onPress={() => router.replace("/login")}>
              <Text className="text-sm text-primary font-semibold">Faça login aqui</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
