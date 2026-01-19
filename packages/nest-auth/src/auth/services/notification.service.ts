import { Injectable, Inject, Logger } from '@nestjs/common';
import { MailerService, MailerServiceToken } from '@devlab-io/nest-mailer';
import { ActionType, Action } from '@devlab-io/nest-auth-types';
import { ClientConfig, ClientActionConfig } from '../config/client.config';
import { ActionTypeUtils } from '../utils';

/**
 * Service responsible for sending notifications (emails)
 */
@Injectable()
export class NotificationService {
  private readonly logger: Logger = new Logger(NotificationService.name);

  public constructor(
    @Inject(MailerServiceToken) private readonly mailerService: MailerService,
  ) {}

  /**
   * Get the action configuration for a specific action type from the client config
   */
  private getClientAction(
    client: ClientConfig,
    actionType: ActionType,
  ): ClientActionConfig | undefined {
    switch (actionType) {
      case ActionType.Invite:
        return client.actions.invite;
      case ActionType.ValidateEmail:
        return client.actions.validateEmail;
      case ActionType.ResetPassword:
        return client.actions.resetPassword;
      case ActionType.ChangePassword:
        return client.actions.changePassword;
      case ActionType.ChangeEmail:
        return client.actions.changeEmail;
      case ActionType.AcceptTerms:
        return client.actions.acceptTerms;
      case ActionType.AcceptPrivacyPolicy:
        return client.actions.acceptPrivacyPolicy;
      default:
        return undefined;
    }
  }

  /**
   * Build a custom frontend link for an action token
   *
   * @param actionType - The action token type
   * @param client - The client configuration
   * @param token - The token value
   * @param email - The user email
   * @returns The custom link if route is configured, undefined otherwise
   */
  public buildActionLink(
    actionType: ActionType,
    client: ClientConfig,
    token: string,
    email: string,
  ): string | undefined {
    // If client has no URI, return undefined (code-only mode)
    if (!client.uri) {
      return undefined;
    }

    // Get the action configuration for this client
    const actionConfig: ClientActionConfig | undefined = this.getClientAction(
      client,
      actionType,
    );

    // If no route is configured, return undefined
    if (!actionConfig?.route) {
      return undefined;
    }

    // Handle deeplinks vs web URLs
    if (client.uri.includes('://') && !client.uri.startsWith('http')) {
      // Deeplink format: myapp://path?token=...&email=...
      return `${client.uri}${actionConfig.route}?token=${token}&email=${encodeURIComponent(email)}`;
    }

    // Web URL format
    const url: URL = new URL(`${client.uri}/${actionConfig.route}`);
    url.searchParams.set('token', token);
    url.searchParams.set('email', email.toLowerCase());

    return url.toString();
  }

  /**
   * Get the validity (expiration time in hours) for an action type from client config
   *
   * @param client - The client configuration
   * @param actionType - The action type
   * @returns The validity in hours
   */
  public getActionValidity(
    client: ClientConfig,
    actionType: ActionType,
  ): number {
    const actionConfig = this.getClientAction(client, actionType);
    // Default to 24 hours if not configured
    return actionConfig?.validity ?? 24;
  }

  /**
   * Generate email content from action bit mask
   *
   * @param actions - Bit mask of actions
   * @param token - The token value
   * @param expiresIn - Expiration time in hours
   * @param customLink - Optional custom link to use instead of the token
   * @returns Email subject and body
   */
  public generateEmailContent(
    actions: number,
    token: string,
    expiresIn: number,
    customLink?: string,
  ): { subject: string; body: string } {
    const actionNames: string[] = [];
    const actionDescriptions: string[] = [];

    if (ActionTypeUtils.hasAction(actions, ActionType.Invite)) {
      actionNames.push('Invitation');
      actionDescriptions.push("Rejoindre l'application");
    }
    if (ActionTypeUtils.hasAction(actions, ActionType.ValidateEmail)) {
      actionNames.push('Validation Email');
      actionDescriptions.push('Valider votre adresse email');
    }
    if (ActionTypeUtils.hasAction(actions, ActionType.AcceptTerms)) {
      actionNames.push('Acceptation CGU');
      actionDescriptions.push("Accepter les conditions d'utilisation");
    }
    if (ActionTypeUtils.hasAction(actions, ActionType.AcceptPrivacyPolicy)) {
      actionNames.push('Acceptation Politique de Confidentialité');
      actionDescriptions.push('Accepter la politique de confidentialité');
    }
    if (ActionTypeUtils.hasAction(actions, ActionType.ChangePassword)) {
      actionNames.push('Changement de Mot de Passe');
      actionDescriptions.push('Changez votre mot de passe');
    }
    if (ActionTypeUtils.hasAction(actions, ActionType.ResetPassword)) {
      actionNames.push('Réinitialisation Mot de Passe');
      actionDescriptions.push('Réinitialiser votre mot de passe');
    }
    if (ActionTypeUtils.hasAction(actions, ActionType.ChangeEmail)) {
      actionNames.push('Changement Email');
      actionDescriptions.push('Changer votre adresse email');
    }

    const subject: string =
      actionNames.length === 1
        ? actionNames[0]
        : `Actions Requises: ${actionNames.join(', ')}`;

    const actionList: string = actionDescriptions
      .map((desc, index) => `${index + 1}. ${desc}`)
      .join('\n');

    // Use custom link if provided, otherwise use the token
    const link: string = customLink ?? token;

    // TODO : EMAIL TEMPLATE ?
    const body: string = `Bonjour,

Vous avez reçu ce message car vous devez effectuer une ou plusieurs actions sur votre compte.

${actionList}

Veuillez utiliser le lien suivant pour effectuer ces actions :
${link}

Ce lien est valide pendant ${expiresIn} heures.

Cordialement,
L'équipe`;

    return { subject, body };
  }

  /**
   * Send an action token email
   *
   * @param email - The recipient email address
   * @param actionToken - The action token entity
   * @param client - The client configuration
   * @throws Error if email sending fails
   */
  public async sendActionTokenEmail(
    email: string,
    actionToken: Action,
    client: ClientConfig,
  ): Promise<void> {
    // Get validity from client config
    const expiresIn: number = this.getActionValidity(client, actionToken.type);

    // Build custom link if route is configured
    const customLink: string | undefined = this.buildActionLink(
      actionToken.type,
      client,
      actionToken.token,
      email,
    );

    // Generate email content from actions
    const emailContent: { subject: string; body: string } =
      this.generateEmailContent(
        actionToken.type,
        actionToken.token,
        expiresIn,
        customLink,
      );

    // Send the email
    await this.mailerService.send(
      email,
      emailContent.subject,
      emailContent.body,
    );

    // Log
    this.logger.debug(
      `Action token email sent to ${email} for actions: ${actionToken.type}`,
    );
  }
}
