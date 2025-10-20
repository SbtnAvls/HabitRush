import apiClient from './apiClient';

/**
 * Servicio para manejar el sistema de resurrección (cuando el usuario tiene 0 vidas)
 */

export interface RevivalChallenge {
  user_challenge_id: string;
  challenge_id: string;
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  habit_name: string;
  assigned_at: string;
}

export interface ProofValidationResult {
  is_valid: boolean;
  confidence_score: number;
  reasoning: string;
}

export interface ProofSubmissionResponse {
  success: boolean;
  message: string;
  validationResult?: ProofValidationResult;
}

export interface ProofStatus {
  proof_type: 'text' | 'image' | 'both';
  validation_status: 'pending' | 'approved' | 'rejected';
  validation_result?: ProofValidationResult;
  validated_at?: string;
}

export class RevivalService {
  /**
   * Obtener challenges disponibles para revivir (solo cuando lives = 0)
   */
  static async getAvailableChallenges(): Promise<{
    success: boolean;
    challenges: RevivalChallenge[];
    message: string;
  }> {
    try {
      const response = await apiClient.get('/challenges/available-for-revival');
      return response.data;
    } catch (error: any) {
      console.error('Error getting revival challenges:', error);

      // Si el usuario tiene vidas, este endpoint dará error
      if (error?.status === 400 && error?.message?.includes('solo está disponible')) {
        throw new Error('Esta función solo está disponible cuando no tienes vidas');
      }

      throw error;
    }
  }

  /**
   * Enviar pruebas de completación de un challenge
   */
  static async submitProof(
    userChallengeId: string,
    proofText: string,
    proofImageUrl?: string
  ): Promise<ProofSubmissionResponse> {
    try {
      // Validar pruebas antes de enviar
      if (!proofText && !proofImageUrl) {
        throw new Error('Debes proporcionar al menos una prueba (texto o imagen)');
      }

      if (proofText && proofText.length < 20) {
        throw new Error('La descripción es muy corta. Proporciona más detalles.');
      }

      const response = await apiClient.post(
        `/challenges/${userChallengeId}/submit-proof`,
        {
          proofText,
          proofImageUrl
        }
      );

      return response.data;
    } catch (error: any) {
      console.error('Error submitting proof:', error);

      // Manejar errores específicos
      if (error?.status === 400) {
        if (error?.message?.includes('pruebas')) {
          throw new Error('Las pruebas no fueron suficientes. Proporciona más detalles o una foto.');
        }
      }

      throw error;
    }
  }

  /**
   * Verificar el estado de validación de las pruebas
   */
  static async getProofStatus(userChallengeId: string): Promise<{
    success: boolean;
    proof: ProofStatus;
  }> {
    try {
      const response = await apiClient.get(`/challenges/${userChallengeId}/proof-status`);
      return response.data;
    } catch (error: any) {
      console.error('Error getting proof status:', error);
      throw error;
    }
  }

  /**
   * Verificar si el usuario puede usar el sistema de revival
   * (debe tener 0 vidas)
   */
  static canUseRevivalSystem(userLives: number): boolean {
    return userLives === 0;
  }

  /**
   * Validar pruebas antes de enviarlas (validación del lado del cliente)
   */
  static validateProof(text?: string, imageSize?: number): string | null {
    if (!text && !imageSize) {
      return 'Debes enviar al menos una prueba (texto o imagen)';
    }

    if (text && text.length < 20) {
      return 'La descripción es muy corta (mínimo 20 caracteres)';
    }

    if (imageSize && imageSize > 5000000) {
      return 'La imagen es muy pesada (máximo 5MB)';
    }

    return null;
  }
}