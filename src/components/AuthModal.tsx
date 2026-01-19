import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useThemedStyles } from '../theme/useThemedStyles';
import { AuthService, RegisterCredentials, LoginCredentials } from '../services/authService';

interface AuthModalProps {
  visible: boolean;
  onClose: () => void;
  onAuthSuccess: () => void;
}

type AuthMode = 'login' | 'register';

export const AuthModal: React.FC<AuthModalProps> = ({
  visible,
  onClose,
  onAuthSuccess,
}) => {
  const styles = useThemedStyles(baseStyles);
  const [mode, setMode] = useState<AuthMode>('login');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const isMountedRef = useRef(true);

  // Campos del formulario
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Resetear el ref cuando el modal se abre
  useEffect(() => {
    if (visible) {
      isMountedRef.current = true;
    }
  }, [visible]);

  const resetForm = () => {
    setName('');
    setEmail('');
    setPassword('');
    setMode('login');
  };

  const handleClose = () => {
    isMountedRef.current = false;
    resetForm();
    onClose();
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Por favor ingresa email y contraseña');
      return;
    }

    if (!validateEmail(email)) {
      Alert.alert('Error', 'Por favor ingresa un email válido');
      return;
    }

    setLoading(true);
    try {
      const credentials: LoginCredentials = {
        email: email.trim(),
        password: password,
      };

      const response = await AuthService.login(credentials);
      console.log(`Login successful, token expires in ${response.expiresIn} seconds`);

      resetForm();
      onAuthSuccess();
    } catch (error: any) {
      // Manejar rate limiting
      if (error?.status === 429 || error?.message?.includes('Demasiados intentos')) {
        Alert.alert(
          'Demasiados intentos',
          'Por favor espera 15 minutos antes de intentar de nuevo.'
        );
      } else {
        Alert.alert(
          'Error al iniciar sesión',
          error.message || 'Hubo un problema al iniciar sesión. Por favor intenta de nuevo.'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }

    if (!validateEmail(email)) {
      Alert.alert('Error', 'Por favor ingresa un email válido');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setLoading(true);
    try {
      const credentials: RegisterCredentials = {
        name: name.trim(),
        email: email.trim(),
        password: password,
      };

      const response = await AuthService.register(credentials);
      console.log(`Registration successful, token expires in ${response.expiresIn} seconds`);

      resetForm();
      onAuthSuccess();
    } catch (error: any) {
      // Manejar rate limiting
      if (error?.status === 429 || error?.message?.includes('Demasiados intentos')) {
        Alert.alert(
          'Demasiados intentos',
          'Por favor espera 15 minutos antes de intentar de nuevo.'
        );
      } else {
        Alert.alert(
          'Error al registrarse',
          error.message || 'Hubo un problema al crear tu cuenta. Por favor intenta de nuevo.'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = () => {
    if (mode === 'login') {
      handleLogin();
    } else {
      handleRegister();
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      const response = await AuthService.loginWithGoogle();
      console.log(`Google login successful, token expires in ${response.expiresIn} seconds`);

      // Evitar actualizar estado si el componente se desmontó
      if (!isMountedRef.current) return;

      resetForm();
      onAuthSuccess();
    } catch (error: any) {
      // Evitar actualizar estado si el componente se desmontó
      if (!isMountedRef.current) return;

      // No mostrar alerta si el usuario canceló
      if (error.message === 'Inicio de sesión cancelado') {
        return;
      }

      Alert.alert(
        'Error con Google',
        error.message || 'No se pudo iniciar sesión con Google. Por favor intenta de nuevo.'
      );
    } finally {
      if (isMountedRef.current) {
        setGoogleLoading(false);
      }
    }
  };

  const toggleMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleClose}
    >
      <View style={styles.modalBackground}>
        <View style={styles.modalContainer}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={styles.title}>
              {mode === 'login' ? 'Iniciar Sesión' : 'Crear Cuenta'}
            </Text>

            <Text style={styles.description}>
              {mode === 'login'
                ? 'Ingresa tus credenciales para continuar'
                : 'Para guardar tus hábitos necesitas crear una cuenta'}
            </Text>

            <View style={styles.form}>
              {mode === 'register' && (
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Nombre</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Ingresa tu nombre"
                    value={name}
                    onChangeText={setName}
                    autoCapitalize="words"
                    editable={!loading}
                  />
                </View>
              )}

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={styles.input}
                  placeholder="tu@email.com"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  editable={!loading}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Contraseña</Text>
                <TextInput
                  style={styles.input}
                  placeholder={mode === 'register' ? 'Mínimo 6 caracteres' : 'Ingresa tu contraseña'}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  autoCapitalize="none"
                  editable={!loading}
                />
              </View>
            </View>

            <TouchableOpacity
              style={[styles.submitButton, loading && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={loading || googleLoading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.submitButtonText}>
                  {mode === 'login' ? 'Iniciar Sesión' : 'Crear Cuenta'}
                </Text>
              )}
            </TouchableOpacity>

            <View style={styles.dividerContainer}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>o</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity
              style={[styles.googleButton, googleLoading && styles.submitButtonDisabled]}
              onPress={handleGoogleSignIn}
              disabled={loading || googleLoading}
            >
              {googleLoading ? (
                <ActivityIndicator color="#757575" />
              ) : (
                <>
                  <Text style={styles.googleIcon}>G</Text>
                  <Text style={styles.googleButtonText}>Continuar con Google</Text>
                </>
              )}
            </TouchableOpacity>

            <View style={styles.toggleContainer}>
              <Text style={styles.toggleText}>
                {mode === 'login'
                  ? '¿No tienes cuenta?'
                  : '¿Ya tienes cuenta?'}
              </Text>
              <TouchableOpacity onPress={toggleMode} disabled={loading || googleLoading}>
                <Text style={[styles.toggleLink, (loading || googleLoading) && styles.disabledText]}>
                  {mode === 'login' ? 'Regístrate' : 'Inicia sesión'}
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleClose}
              disabled={loading || googleLoading}
            >
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const baseStyles = {
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    padding: 16,
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    maxHeight: '90%',
    overflow: 'hidden',
  },
  scrollContent: {
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2C3E50',
    marginBottom: 8,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    color: '#6C757D',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  form: {
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E9ECEF',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#2C3E50',
  },
  submitButton: {
    backgroundColor: '#4ECDC4',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 16,
    minHeight: 50,
    justifyContent: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E9ECEF',
  },
  dividerText: {
    marginHorizontal: 12,
    fontSize: 14,
    color: '#6C757D',
  },
  googleButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 16,
    minHeight: 50,
    justifyContent: 'center',
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#DADCE0',
  },
  googleIcon: {
    fontSize: 18,
    fontWeight: '700',
    color: '#4285F4',
    marginRight: 10,
  },
  googleButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#757575',
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  toggleText: {
    fontSize: 14,
    color: '#6C757D',
    marginRight: 4,
  },
  toggleLink: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4ECDC4',
  },
  disabledText: {
    opacity: 0.5,
  },
  cancelButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    color: '#6C757D',
  },
} as const;

