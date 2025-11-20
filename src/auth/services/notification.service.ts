import { Injectable, Inject, Logger } from '@nestjs/common';
import { MailerService, MailerServiceToken } from '@devlab-io/nest-mailer';
import { ActionTokenType, ActionToken } from '../types';
import { ActionConfig, ActionConfigToken } from '../config/action.config';
import { ActionTokenTypeUtils } from '../utils';

/**
 * Service responsible for sending notifications (emails)
 */
@Injectable()
export class NotificationService {
  private readonly logger: Logger = new Logger(NotificationService.name);

  public constructor(
    @Inject(MailerServiceToken) private readonly mailerService: MailerService,
    @Inject(ActionConfigToken) private readonly actionConfig: ActionConfig,
  ) {}

  /**
   * Build a custom frontend link for an action token
   *
   * @param actionType - The action token type
   * @param frontendUrl - The frontend URL
   * @param token - The token value
   * @param email - The user email
   * @returns The custom link if route is configured, undefined otherwise
   */
  public buildActionLink(
    actionType: ActionTokenType,
    frontendUrl: string,
    token: string,
    email: string,
  ): string | undefined {
    let actionRoute: string | undefined;

    // Get the route for the specific action type
    if (actionType === ActionTokenType.Invite) {
      actionRoute = this.actionConfig.invite.route;
    } else if (actionType === ActionTokenType.ValidateEmail) {
      actionRoute = this.actionConfig.validateEmail.route;
    } else if (actionType === ActionTokenType.CreatePassword) {
      actionRoute = this.actionConfig.createPassword.route;
    } else if (actionType === ActionTokenType.ResetPassword) {
      actionRoute = this.actionConfig.resetPassword.route;
    } else if (actionType === ActionTokenType.ChangeEmail) {
      actionRoute = this.actionConfig.changeEmail.route;
    } else if (actionType === ActionTokenType.AcceptTerms) {
      actionRoute = this.actionConfig.acceptTerms.route;
    } else if (actionType === ActionTokenType.AcceptPrivacyPolicy) {
      actionRoute = this.actionConfig.acceptPrivacyPolicy.route;
    }

    // If no route is configured, return undefined
    if (!actionRoute) {
      return undefined;
    }

    // Build the complete URL with query parameters
    const url = new URL(`${frontendUrl}/${actionRoute}`);
    url.searchParams.set('token', token);
    url.searchParams.set('email', email.toLowerCase());

    return url.toString();
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

    if (ActionTokenTypeUtils.hasAction(actions, ActionTokenType.Invite)) {
      actionNames.push('Invitation');
      actionDescriptions.push("Rejoindre l'application");
    }
    if (
      ActionTokenTypeUtils.hasAction(actions, ActionTokenType.ValidateEmail)
    ) {
      actionNames.push('Validation Email');
      actionDescriptions.push('Valider votre adresse email');
    }
    if (ActionTokenTypeUtils.hasAction(actions, ActionTokenType.AcceptTerms)) {
      actionNames.push('Acceptation CGU');
      actionDescriptions.push("Accepter les conditions d'utilisation");
    }
    if (
      ActionTokenTypeUtils.hasAction(
        actions,
        ActionTokenType.AcceptPrivacyPolicy,
      )
    ) {
      actionNames.push('Acceptation Politique de Confidentialité');
      actionDescriptions.push('Accepter la politique de confidentialité');
    }
    if (
      ActionTokenTypeUtils.hasAction(actions, ActionTokenType.CreatePassword)
    ) {
      actionNames.push('Création Mot de Passe');
      actionDescriptions.push('Créer votre mot de passe');
    }
    if (
      ActionTokenTypeUtils.hasAction(actions, ActionTokenType.ResetPassword)
    ) {
      actionNames.push('Réinitialisation Mot de Passe');
      actionDescriptions.push('Réinitialiser votre mot de passe');
    }
    if (ActionTokenTypeUtils.hasAction(actions, ActionTokenType.ChangeEmail)) {
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
   * @param frontendUrl - Frontend URL to construct the action link
   * @param expiresIn - Expiration time in hours
   * @throws Error if email sending fails
   */
  public async sendActionTokenEmail(
    email: string,
    actionToken: ActionToken,
    frontendUrl: string,
    expiresIn: number,
  ): Promise<void> {
    // Build custom link if route is configured
    const customLink: string | undefined = this.buildActionLink(
      actionToken.type,
      frontendUrl,
      actionToken.token,
      email,
    );

    // Generate email content from actions
    const emailContent = this.generateEmailContent(
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
