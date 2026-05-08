// Importation des modules nécessaires d’Angular
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';


// Interface représentant la requête envoyée à l’assistant IA
// Elle contient le message de l’utilisateur ainsi que des informations optionnelles
export interface AssistantRequest {
  message: string;
  clientId?: number | null;
  conversationId?: string | null;
}

// Interface représentant la réponse retournée par l’assistant IA
// Elle peut contenir une réponse textuelle, un état de déclaration ou des informations sur un sinistre
export interface AssistantResponse {
  answer: string;
  claimDeclarationMode?: boolean;
  needsFileUpload?: boolean;
  declarationCompleted?: boolean;
  claimId?: number;
  status?: string;
}

// Déclaration du service comme injectable dans toute l’application
@Injectable({
  providedIn: 'root'
})
export class AssistantService {

  // URL de l’API backend utilisée pour envoyer les messages à l’assistant IA
  private chatUrl = 'http://localhost:8080/api/assistant/chat';

  // URL de l’API backend utilisée pour téléverser les documents liés à un sinistre
  private uploadUrl = 'http://localhost:8080/api/assistant/claim-documents';

  // Injection de HttpClient pour envoyer des requêtes HTTP vers le backend
  constructor(private http: HttpClient) {}

  // Méthode permettant d’envoyer un message à l’assistant IA
  // Elle prépare le corps de la requête avec le message, le client et la conversation en cours
  sendMessage(
    message: string,
    clientId?: number | null,
    conversationId?: string | null
  ): Observable<AssistantResponse> {
    const body: AssistantRequest = {
      message,
      clientId: clientId ?? null,
      conversationId: conversationId ?? null
    };

    return this.http.post<AssistantResponse>(this.chatUrl, body);
  }

  // Méthode permettant d’envoyer des documents liés à une déclaration de sinistre
  // Elle utilise FormData pour transférer plusieurs fichiers vers le backend
  uploadClaimDocuments(
    clientId: number,
    files: File[],
    conversationId?: string | null
  ): Observable<AssistantResponse> {
    const formData = new FormData();

    // Ajout de l’identifiant du client dans les données envoyées
    formData.append('clientId', String(clientId));

    // Ajout optionnel de l’identifiant de conversation si celui-ci existe
    if (conversationId) {
      formData.append('conversationId', conversationId);
    }

    // Ajout de chaque document dans le même champ attendu par le backend
    files.forEach(file => {
      formData.append('documents', file);
    });

    return this.http.post<AssistantResponse>(this.uploadUrl, formData);
  }
}
