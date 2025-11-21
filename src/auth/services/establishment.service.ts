import { Repository } from 'typeorm';
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EstablishmentEntity } from '../entities';
import { OrganisationService } from './organisation.service';
import {
  CreateEstablishmentRequest,
  UpdateEstablishmentRequest,
  EstablishmentQueryParams,
  EstablishmentPage,
} from '../types';

@Injectable()
export class EstablishmentService {
  private readonly logger: Logger = new Logger(EstablishmentService.name);

  /**
   * Constructor
   *
   * @param establishmentRepository - The establishment repository
   * @param organisationService - The organisation service
   */
  public constructor(
    @InjectRepository(EstablishmentEntity)
    private readonly establishmentRepository: Repository<EstablishmentEntity>,
    private readonly organisationService: OrganisationService,
  ) {}

  /**
   * Create a new establishment
   *
   * @param request - The create establishment request
   * @returns The created establishment
   * @throws NotFoundException if the organisation is not found
   * @throws BadRequestException if an establishment with the same name already exists in the organisation
   */
  public async create(
    request: CreateEstablishmentRequest,
  ): Promise<EstablishmentEntity> {
    // Verify that the organisation exists
    const organisation = await this.organisationService.getById(
      request.organisationId,
    );

    // Check if an establishment with the same name already exists in this organisation
    const existing = await this.findByNameAndOrganisation(
      request.name,
      request.organisationId,
    );

    if (existing) {
      throw new BadRequestException(
        `Establishment with name "${request.name}" already exists in this organisation`,
      );
    }

    // Create new establishment
    const establishment: EstablishmentEntity =
      this.establishmentRepository.create({
        name: request.name,
        organisation: organisation,
      });

    // Save the establishment
    const saved = await this.establishmentRepository.save(establishment);

    // Log
    this.logger.debug(
      `Establishment "${saved.name}" created with ID ${saved.id} in organisation ${organisation.name}`,
    );

    // Return the establishment
    return saved;
  }

  /**
   * Get an establishment by ID
   *
   * @param id - The ID of the establishment
   * @returns The establishment
   * @throws NotFoundException if the establishment is not found
   */
  public async getById(id: string): Promise<EstablishmentEntity> {
    const establishment = await this.findById(id);

    if (!establishment) {
      throw new NotFoundException(`Establishment with ID ${id} not found`);
    }

    return establishment;
  }

  /**
   * Find an establishment by ID
   *
   * @param id - The ID of the establishment
   * @returns The establishment or null if not found
   */
  public async findById(id: string): Promise<EstablishmentEntity | null> {
    return await this.establishmentRepository.findOne({
      where: { id },
      relations: ['organisation', 'userAccounts'],
    });
  }

  /**
   * Find an establishment by name and organisation
   *
   * @param name - The name of the establishment
   * @param organisationId - The ID of the organisation
   * @returns The establishment or null if not found
   */
  public async findByNameAndOrganisation(
    name: string,
    organisationId: string,
  ): Promise<EstablishmentEntity | null> {
    return await this.establishmentRepository.findOne({
      where: {
        name,
        organisation: { id: organisationId },
      },
      relations: ['organisation', 'userAccounts'],
    });
  }

  /**
   * Check if an establishment exists by ID
   *
   * @param id - The ID of the establishment
   * @returns True if the establishment exists, false otherwise
   */
  public async exists(id: string): Promise<boolean> {
    const count = await this.establishmentRepository.count({
      where: { id },
    });
    return count > 0;
  }

  /**
   * Search establishments with pagination and filters
   *
   * @param params - The query parameters
   * @param page - The page number (default: 1)
   * @param limit - The number of establishments per page (default: 10)
   * @returns The establishments page
   */
  public async search(
    params: EstablishmentQueryParams,
    page: number = 1,
    limit: number = 10,
  ): Promise<EstablishmentPage> {
    const skip = (page - 1) * limit;
    const queryBuilder = this.establishmentRepository
      .createQueryBuilder('establishment')
      .leftJoinAndSelect('establishment.organisation', 'organisation')
      .leftJoinAndSelect('establishment.userAccounts', 'userAccounts');

    // Apply filters
    if (params.id) {
      queryBuilder.andWhere('establishment.id = :id', { id: params.id });
    }
    if (params.name) {
      queryBuilder.andWhere('establishment.name ILIKE :name', {
        name: `%${params.name}%`,
      });
    }
    if (params.organisationId) {
      queryBuilder.andWhere('organisation.id = :organisationId', {
        organisationId: params.organisationId,
      });
    }

    // Apply pagination and ordering
    queryBuilder
      .distinct(true)
      .skip(skip)
      .take(limit)
      .orderBy('establishment.name', 'ASC');

    // Execute query
    const [data, total]: [EstablishmentEntity[], number] =
      await queryBuilder.getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
    };
  }

  /**
   * Update an establishment
   *
   * @param id - The ID of the establishment
   * @param request - The update request
   * @returns The updated establishment
   * @throws NotFoundException if the establishment is not found
   * @throws NotFoundException if the new organisation is not found
   * @throws BadRequestException if an establishment with the new name already exists in the organisation
   */
  public async update(
    id: string,
    request: UpdateEstablishmentRequest,
  ): Promise<EstablishmentEntity> {
    // Get the establishment with the given ID
    let establishment: EstablishmentEntity = await this.getById(id);

    // Handle organisation change if provided
    if (request.organisationId) {
      const newOrganisation = await this.organisationService.getById(
        request.organisationId,
      );
      establishment.organisation = newOrganisation;
    }

    // Check if name is being updated and if it conflicts with existing establishment in the same organisation
    const targetOrganisationId: string =
      request.organisationId || establishment.organisation.id;
    if (request.name && request.name !== establishment.name) {
      const existing = await this.findByNameAndOrganisation(
        request.name,
        targetOrganisationId,
      );

      if (existing && existing.id !== establishment.id) {
        throw new BadRequestException(
          `Establishment with name "${request.name}" already exists in this organisation`,
        );
      }
    }

    // Update the establishment
    if (request.name !== undefined) {
      establishment.name = request.name;
    }

    // Save the establishment
    establishment = await this.establishmentRepository.save(establishment);

    // Log
    this.logger.debug(`Establishment with ID ${establishment.id} updated`);

    // Return the establishment
    return establishment;
  }

  /**
   * Delete an establishment
   *
   * @param id - The ID of the establishment
   * @throws NotFoundException if the establishment is not found
   */
  public async delete(id: string): Promise<void> {
    // Get the establishment with the given ID
    const establishment: EstablishmentEntity = await this.getById(id);

    // Delete the establishment (cascade will handle related user accounts)
    await this.establishmentRepository.remove(establishment);

    // Log
    this.logger.debug(`Establishment with ID ${id} deleted`);
  }
}
