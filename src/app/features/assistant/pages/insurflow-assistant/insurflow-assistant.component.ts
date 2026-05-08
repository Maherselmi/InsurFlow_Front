// Importation des modules Angular nécessaires au composant
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

// Importation des services et modèles utilisés pour le client, l’authentification et l’assistant IA
import { Client, ClientService } from "../../../clients/data-access/client.service";
import { AuthService } from "../../../../core/auth/auth.service";
import { AssistantResponse, AssistantService } from "../../data-access/assistant.service";


// Interface représentant une police d’assurance affichée sous forme de carte dans le chat
interface PolicyCard {
  id: string;
  number: string;
  type: string;
  formule?: string;
  endDate?: string;
}

// Interface représentant un dossier de sinistre affiché sous forme de carte dans le chat
interface ClaimCard {
  id: string;
  status: string;
  incidentDate?: string;
  policyNumber?: string;
}

// Interface représentant un message échangé entre l’utilisateur et l’assistant
interface ChatMessage {
  sender: 'user' | 'bot';
  text: string;
  kind?: 'text' | 'policies' | 'claims';
  policies?: PolicyCard[];
  claims?: ClaimCard[];
}

// Interface représentant une action rapide proposée à l’utilisateur
interface AssistantAction {
  title: string;
  subtitle: string;
  icon: string;
  message: string;
}

// Interface représentant une discussion complète avec l’assistant
interface ChatDiscussion {
  id: string;
  title: string;
  messages: ChatMessage[];
  needsFileUpload: boolean;
  createdAt: string;
  updatedAt: string;
}

// Interface représentant la structure des discussions sauvegardées dans le localStorage
interface ChatStorageData {
  selectedDiscussionId: string;
  discussions: ChatDiscussion[];
}

// Déclaration du composant Angular responsable de l’espace assistant client InsurFlow
@Component({
  selector: 'app-insurflow-assistant',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './insurflow-assistant.component.html',
  styleUrls: ['./insurflow-assistant.component.css']
})
export class InsurflowAssistantComponent implements OnInit {

  // Préfixe utilisé pour stocker les discussions du chatbot par utilisateur
  private readonly CHAT_STORAGE_PREFIX = 'insurflow_chat_discussions_';

  // Clé complète utilisée dans le localStorage selon l’email du client connecté
  private chatStorageKey = '';

  // Profil du client actuellement connecté
  client: Client | null = null;

  // États utilisés pour gérer le chargement du profil, le chargement du chatbot et la saisie utilisateur
  loadingProfile = true;
  chatbotLoading = false;
  chatInput = '';

  // Liste des fichiers sélectionnés par l’utilisateur pour une déclaration de sinistre
  selectedFiles: File[] = [];

  // Liste des discussions enregistrées et identifiant de la discussion active
  discussions: ChatDiscussion[] = [];
  selectedDiscussionId = '';

  // Actions rapides affichées dans l’interface pour aider l’utilisateur à interagir avec l’assistant
  actions: AssistantAction[] = [
    {
      title: 'Mes polices',
      subtitle: 'consulter mes contrats',
      icon: '📄',
      message: 'Afficher mes polices'
    },
    {
      title: 'Mes sinistres',
      subtitle: 'suivre mes dossiers',
      icon: '🛡️',
      message: 'Afficher mes dossiers de sinistre'
    },
    {
      title: 'Déclarer',
      subtitle: 'un nouveau sinistre',
      icon: '📝',
      message: 'Je veux déclarer un sinistre'
    },
    {
      title: 'Aide',
      subtitle: 'comprendre les étapes',
      icon: '🎧',
      message: 'Comment déclarer un sinistre ?'
    }
  ];

  // Injection des services nécessaires : authentification, client, assistant IA et navigation
  constructor(
    private authService: AuthService,
    private clientService: ClientService,
    private assistantService: AssistantService,
    private router: Router
  ) {}

  // Méthode exécutée automatiquement au chargement du composant
  // Elle vérifie l’authentification, initialise les discussions et charge le profil client
  ngOnInit(): void {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }

    const email = this.getStoredEmail();

    if (!email) {
      this.loadingProfile = false;
      this.createDefaultDiscussion();
      this.addBotMessage(
        'Je ne peux pas identifier votre profil client. Veuillez vous reconnecter.'
      );
      return;
    }

    this.chatStorageKey = this.CHAT_STORAGE_PREFIX + email.toLowerCase();

    this.loadDiscussions();
    this.loadCurrentClient(email);
  }

  // Getter qui retourne la discussion actuellement sélectionnée
  get selectedDiscussion(): ChatDiscussion | null {
    return this.discussions.find(d => d.id === this.selectedDiscussionId) ?? null;
  }

  // Getter qui retourne les messages de la discussion active
  get messages(): ChatMessage[] {
    return this.selectedDiscussion?.messages ?? [];
  }

  // Getter qui indique si l’assistant demande à l’utilisateur d’envoyer des documents
  get needsFileUpload(): boolean {
    return !!this.selectedDiscussion?.needsFileUpload;
  }

  // Setter qui met à jour l’état d’envoi de documents dans la discussion active
  set needsFileUpload(value: boolean) {
    if (!this.selectedDiscussion) return;

    this.selectedDiscussion.needsFileUpload = value;
    this.selectedDiscussion.updatedAt = new Date().toISOString();
    this.saveDiscussions();
  }

  // Getter qui retourne le nom complet du client connecté
  // Si le profil n’est pas encore chargé, une valeur par défaut est affichée
  get fullName(): string {
    if (!this.client) return 'Client InsurFlow';
    return `${this.client.firstName} ${this.client.lastName}`;
  }

  // Méthode permettant de charger le profil client à partir de l’email stocké
  // Elle cherche le client correspondant dans la liste des clients
  loadCurrentClient(email: string): void {
    this.clientService.getAllClients().subscribe({
      next: clients => {
        const found = clients.find(
          c => c.email?.toLowerCase() === email.toLowerCase()
        );

        this.client = found ?? null;
        this.loadingProfile = false;

        if (!found) {
          this.addBotMessage(
            'Aucun profil client n’est associé à cet email. Veuillez contacter un gestionnaire.'
          );
        }
      },
      error: err => {
        console.error(err);
        this.loadingProfile = false;
        this.addBotMessage(
          'Impossible de charger votre profil client pour le moment.'
        );
      }
    });
  }

  // Méthode permettant de charger les discussions sauvegardées depuis le localStorage
  // Si aucune discussion n’existe, une discussion par défaut est créée
  loadDiscussions(): void {
    if (!this.chatStorageKey) {
      this.createDefaultDiscussion();
      return;
    }

    const saved = localStorage.getItem(this.chatStorageKey);

    if (!saved) {
      this.createDefaultDiscussion();
      return;
    }

    try {
      const data = JSON.parse(saved) as ChatStorageData;

      if (!Array.isArray(data.discussions) || data.discussions.length === 0) {
        this.createDefaultDiscussion();
        return;
      }

      // Reconstruction des discussions sauvegardées
      // Les messages du bot sont analysés pour détecter les polices ou les sinistres à afficher sous forme de cartes
      this.discussions = data.discussions.map(discussion => ({
        ...discussion,
        messages: discussion.messages.map(message => {
          if (message.sender === 'bot') {
            return this.buildBotMessage(message.text);
          }

          return {
            ...message,
            kind: message.kind ?? 'text'
          };
        })
      }));

      const selectedExists = this.discussions.some(
        d => d.id === data.selectedDiscussionId
      );

      this.selectedDiscussionId = selectedExists
        ? data.selectedDiscussionId
        : this.discussions[0].id;

      this.selectedFiles = [];
    } catch (error) {
      console.error('Erreur chargement discussions chatbot', error);
      this.createDefaultDiscussion();
    }
  }

  // Méthode permettant de sauvegarder toutes les discussions dans le localStorage
  saveDiscussions(): void {
    if (!this.chatStorageKey) return;

    const data: ChatStorageData = {
      selectedDiscussionId: this.selectedDiscussionId,
      discussions: this.discussions
    };

    localStorage.setItem(this.chatStorageKey, JSON.stringify(data));
  }

  // Méthode permettant de créer une première discussion par défaut
  createDefaultDiscussion(): void {
    const discussion = this.createDiscussion('Discussion 1');

    this.discussions = [discussion];
    this.selectedDiscussionId = discussion.id;
    this.selectedFiles = [];

    this.saveDiscussions();
  }

  // Méthode qui construit une nouvelle discussion avec un message d’accueil du bot
  createDiscussion(title: string): ChatDiscussion {
    const now = new Date().toISOString();

    return {
      id: this.generateDiscussionId(),
      title,
      createdAt: now,
      updatedAt: now,
      needsFileUpload: false,
      messages: [
        {
          sender: 'bot',
          kind: 'text',
          text:
            'Bonjour 👋 Je suis l’assistant InsurFlow. ' +
            'Je peux vous aider à consulter vos polices, suivre vos sinistres ou déclarer un nouveau dossier.'
        }
      ]
    };
  }

  // Méthode permettant de démarrer une nouvelle conversation avec l’assistant
  startNewChat(): void {
    const nextNumber = this.discussions.length + 1;
    const newDiscussion = this.createDiscussion(`Discussion ${nextNumber}`);

    this.discussions.unshift(newDiscussion);
    this.selectedDiscussionId = newDiscussion.id;

    this.chatInput = '';
    this.selectedFiles = [];

    this.saveDiscussions();
  }

  // Méthode permettant de sélectionner une discussion existante
  // Le changement est bloqué si une réponse de l’assistant est en cours
  selectDiscussion(discussionId: string): void {
    if (this.chatbotLoading) return;

    this.selectedDiscussionId = discussionId;
    this.chatInput = '';
    this.selectedFiles = [];

    this.saveDiscussions();
  }

  // Méthode permettant de supprimer une discussion
  // Si aucune discussion ne reste, une discussion par défaut est recréée
  deleteDiscussion(discussionId: string, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }

    this.discussions = this.discussions.filter(d => d.id !== discussionId);

    if (this.discussions.length === 0) {
      this.createDefaultDiscussion();
      return;
    }

    if (this.selectedDiscussionId === discussionId) {
      this.selectedDiscussionId = this.discussions[0].id;
    }

    this.saveDiscussions();
  }

  // Méthode permettant d’effacer les messages de la discussion active
  // Elle conserve la discussion mais réinitialise son contenu
  clearCurrentDiscussion(): void {
    const current = this.selectedDiscussion;

    if (!current) return;

    current.messages = [
      {
        sender: 'bot',
        kind: 'text',
        text:
          'Bonjour 👋 Je suis l’assistant InsurFlow. ' +
          'Je peux vous aider à consulter vos polices, suivre vos sinistres ou déclarer un nouveau dossier.'
      }
    ];

    current.needsFileUpload = false;
    current.updatedAt = new Date().toISOString();

    this.chatInput = '';
    this.selectedFiles = [];

    this.saveDiscussions();
  }

  // Méthode principale d’envoi d’un message à l’assistant IA
  // Elle ajoute le message utilisateur, vérifie le profil client, puis contacte le backend
  sendMessage(): void {
    const message = this.chatInput.trim();

    if (!message || this.chatbotLoading || !this.selectedDiscussion) return;

    this.addUserMessage(message);
    this.updateDiscussionTitleFromMessage(message);

    this.chatInput = '';

    if (this.loadingProfile) {
      this.addBotMessage(
        'Votre profil client est encore en cours de chargement. Veuillez réessayer dans quelques instants.'
      );
      return;
    }

    if (!this.client?.id) {
      this.addBotMessage(
        'Je ne peux pas accéder à vos données personnelles car votre profil client est introuvable.'
      );
      return;
    }

    this.chatbotLoading = true;

    this.assistantService
      .sendMessage(message, this.client.id, this.selectedDiscussionId)
      .subscribe({
        next: response => {
          this.onAssistantResponse(response);
          this.chatbotLoading = false;
        },
        error: err => {
          console.error(err);

          this.addBotMessage(
            'Désolé, une erreur est survenue lors de la communication avec l’assistant.'
          );

          this.chatbotLoading = false;
        }
      });
  }

  // Méthode permettant d’envoyer automatiquement le message associé à une action rapide
  sendActionMessage(action: AssistantAction): void {
    if (this.chatbotLoading) return;

    this.chatInput = action.message;
    this.sendMessage();
  }

  // Méthode appelée après la réponse de l’assistant
  // Elle ajoute la réponse au chat et met à jour l’état de demande de documents
  onAssistantResponse(response: AssistantResponse): void {
    this.addBotMessage(response.answer || 'Je n’ai pas trouvé de réponse.');

    this.needsFileUpload = !!response.needsFileUpload;

    if (response.declarationCompleted) {
      this.selectedFiles = [];
      this.needsFileUpload = false;
    }

    this.saveDiscussions();
  }

  // Méthode appelée lorsque l’utilisateur sélectionne des fichiers
  // Elle transforme la liste de fichiers du champ input en tableau exploitable
  onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;

    if (!input.files) {
      this.selectedFiles = [];
      return;
    }

    this.selectedFiles = Array.from(input.files);
  }

  // Méthode permettant d’envoyer les documents sélectionnés au backend
  // Elle est utilisée pendant une déclaration de sinistre lorsque l’assistant demande des justificatifs
  sendClaimDocuments(): void {
    if (!this.client?.id) {
      this.addBotMessage('Profil client introuvable.');
      return;
    }

    if (!this.selectedFiles.length) {
      this.addBotMessage('Veuillez sélectionner au moins un document.');
      return;
    }

    this.chatbotLoading = true;

    this.assistantService
      .uploadClaimDocuments(
        this.client.id,
        this.selectedFiles,
        this.selectedDiscussionId
      )
      .subscribe({
        next: response => {
          this.selectedFiles = [];
          this.onAssistantResponse(response);
          this.chatbotLoading = false;
        },
        error: err => {
          console.error(err);

          this.addBotMessage(
            'Erreur lors de l’envoi des documents. Veuillez réessayer.'
          );

          this.chatbotLoading = false;
        }
      });
  }

  // Méthode permettant de continuer une déclaration sans envoyer de documents
  continueWithoutDocuments(): void {
    if (this.chatbotLoading) return;

    this.chatInput = 'continuer sans document';
    this.sendMessage();
  }

  // Méthode permettant de retourner vers l’espace client
  goBackToClientSpace(): void {
    this.router.navigate(['/Client_Space']);
  }

  // Méthode permettant de récupérer l’email de l’utilisateur depuis le localStorage
  getStoredEmail(): string | null {
    return localStorage.getItem('email');
  }

  // Méthode qui transforme le statut technique d’un sinistre en libellé lisible
  getClaimStatusLabel(status: string): string {
    switch ((status || '').toUpperCase()) {
      case 'PENDING_VALIDATION':
        return 'En attente de validation';

      case 'IN_ANALYSIS':
        return 'En analyse';

      case 'APPROVED':
        return 'Approuvé';

      case 'REJECTED':
        return 'Rejeté';

      default:
        return status || 'Statut inconnu';
    }
  }

  // Méthode qui retourne la classe CSS associée au statut d’un sinistre
  getClaimStatusClass(status: string): string {
    switch ((status || '').toUpperCase()) {
      case 'APPROVED':
        return 'status-approved';

      case 'REJECTED':
        return 'status-rejected';

      case 'IN_ANALYSIS':
        return 'status-analysis';

      case 'PENDING_VALIDATION':
      default:
        return 'status-pending';
    }
  }

  // Méthode privée permettant d’ajouter un message utilisateur dans la discussion active
  private addUserMessage(text: string): void {
    const current = this.selectedDiscussion;
    if (!current) return;

    current.messages.push({
      sender: 'user',
      text,
      kind: 'text'
    });

    current.updatedAt = new Date().toISOString();

    this.saveDiscussions();
  }

  // Méthode privée permettant d’ajouter un message du bot dans la discussion active
  // Le message est analysé pour savoir s’il contient des polices ou des sinistres
  private addBotMessage(text: string): void {
    const current = this.selectedDiscussion;
    if (!current) return;

    current.messages.push(this.buildBotMessage(text));

    current.updatedAt = new Date().toISOString();

    this.saveDiscussions();
  }

  // Méthode privée qui construit un message bot selon son contenu
  // Si le texte contient des polices ou des sinistres, il est transformé en message spécialisé
  private buildBotMessage(text: string): ChatMessage {
    const policies = this.parsePolicies(text);
    const claims = this.parseClaims(text);

    if (policies.length > 0) {
      return {
        sender: 'bot',
        text,
        kind: 'policies',
        policies
      };
    }

    if (claims.length > 0) {
      return {
        sender: 'bot',
        text,
        kind: 'claims',
        claims
      };
    }

    return {
      sender: 'bot',
      text,
      kind: 'text'
    };
  }

  // Méthode privée permettant d’extraire les polices d’assurance depuis une réponse textuelle du bot
  // Elle utilise une expression régulière pour convertir chaque ligne en objet PolicyCard
  private parsePolicies(text: string): PolicyCard[] {
    const lower = text.toLowerCase();

    if (!lower.includes('polices') && !lower.includes('police')) {
      return [];
    }

    return text
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.startsWith('- ID'))
      .map(line => {
        const regex =
          /^-\s*ID\s+(\d+)\s*:\s*(.+?)\s+—\s+Type\s*:\s*([^—]+)(?:\s+—\s+Formule\s*:\s*([^—]+))?(?:\s+—\s+Fin\s*:\s*(.+))?$/i;

        const match = line.match(regex);

        if (!match) return null;

        return {
          id: match[1]?.trim(),
          number: match[2]?.trim(),
          type: match[3]?.trim(),
          formule: match[4]?.trim(),
          endDate: match[5]?.trim()
        } as PolicyCard;
      })
      .filter((policy): policy is PolicyCard => policy !== null);
  }

  // Méthode privée permettant d’extraire les dossiers de sinistre depuis une réponse textuelle du bot
  // Elle transforme chaque ligne correspondant à un dossier en objet ClaimCard
  private parseClaims(text: string): ClaimCard[] {
    const lower = text.toLowerCase();

    if (!lower.includes('dossiers de sinistre') && !lower.includes('dossiers')) {
      return [];
    }

    return text
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.startsWith('- Dossier'))
      .map(line => {
        const regex =
          /^-\s*Dossier\s+#?(\d+)\s+—\s+Statut\s*:\s*([^—]+)(?:\s+—\s+Date incident\s*:\s*([^—]+))?(?:\s+—\s+Police\s*:\s*(.+))?$/i;

        const match = line.match(regex);

        if (!match) return null;

        return {
          id: match[1]?.trim(),
          status: match[2]?.trim(),
          incidentDate: match[3]?.trim(),
          policyNumber: match[4]?.trim()
        } as ClaimCard;
      })
      .filter((claim): claim is ClaimCard => claim !== null);
  }

  // Méthode privée permettant de renommer automatiquement une discussion
  // Le titre est créé à partir du premier message envoyé par l’utilisateur
  private updateDiscussionTitleFromMessage(message: string): void {
    const current = this.selectedDiscussion;

    if (!current) return;

    const isDefaultTitle = /^Discussion \d+$/.test(current.title);

    if (!isDefaultTitle) return;

    const cleanTitle = message.trim();

    current.title =
      cleanTitle.length > 28
        ? cleanTitle.substring(0, 28) + '...'
        : cleanTitle;

    current.updatedAt = new Date().toISOString();

    this.saveDiscussions();
  }

  // Méthode privée permettant de générer un identifiant unique pour chaque discussion
  private generateDiscussionId(): string {
    return 'disc_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
  }
}
