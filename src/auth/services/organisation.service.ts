import { Repository } from 'typeorm';
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { OrganisationEntity } from '../entities';
import {
  CreateOrganisationRequest,
  UpdateOrganisationRequest,
  OrganisationQueryParams,
  OrganisationPage,
} from '../types';

@Injectable()
export class OrganisationService {
  private readonly logger: Logger = new Logger(OrganisationService.name);

  /**
   * Constructor
   *
   * @param organisationRepository - The organisation repository
   */
  public constructor(
    @InjectRepository(OrganisationEntity)
    private readonly organisationRepository: Repository<OrganisationEntity>,
  ) {}

  /**
   * Create a new organisation
   *
   * @param request - The create organisation request
   * @returns The created organisation
   * @throws BadRequestException if an organisation with the same name already exists
   */
  public async create(
    request: CreateOrganisationRequest,
  ): Promise<OrganisationEntity> {
    // Check if an organisation with the same name already exists
    const existing = await this.findByName(request.name);

    if (existing) {
      throw new BadRequestException(
        `Organisation with name "${request.name}" already exists`,
      );
    }

    // Create new organisation
    const organisation: OrganisationEntity = this.organisationRepository.create(
      {
        name: request.name,
      },
    );

    // Save the organisation
    const saved = await this.organisationRepository.save(organisation);

    // Log
    this.logger.debug(
      `Organisation "${saved.name}" created with ID ${saved.id}`,
    );

    // Return the organisation
    return saved;
  }

  /**
   * Get an organisation by ID
   *
   * @param id - The ID of the organisation
   * @returns The organisation
   * @throws NotFoundException if the organisation is not found
   */
  public async getById(id: string): Promise<OrganisationEntity> {
    const organisation = await this.findById(id);

    if (!organisation) {
      throw new NotFoundException(`Organisation with ID ${id} not found`);
    }

    return organisation;
  }

  /**
   * Find an organisation by ID
   *
   * @param id - The ID of the organisation
   * @returns The organisation or null if not found
   */
  public async findById(id: string): Promise<OrganisationEntity | null> {
    return await this.organisationRepository.findOne({
      where: { id },
      relations: ['establishments'],
    });
  }

  /**
   * Find an organisation by name
   *
   * @param name - The name of the organisation
   * @returns The organisation or null if not found
   */
  public async findByName(name: string): Promise<OrganisationEntity | null> {
    return await this.organisationRepository.findOne({
      where: { name },
      relations: ['establishments'],
    });
  }

  /**
   * Check if an organisation exists by ID
   *
   * @param id - The ID of the organisation
   * @returns True if the organisation exists, false otherwise
   */
  public async exists(id: string): Promise<boolean> {
    const count = await this.organisationRepository.count({
      where: { id },
    });
    return count > 0;
  }

  /**
   * Search organisations with pagination and filters
   *
   * @param params - The query parameters
   * @param page - The page number (default: 1)
   * @param limit - The number of organisations per page (default: 10)
   * @returns The organisations page
   */
  public async search(
    params: OrganisationQueryParams,
    page: number = 1,
    limit: number = 10,
  ): Promise<OrganisationPage> {
    const skip = (page - 1) * limit;
    const queryBuilder = this.organisationRepository
      .createQueryBuilder('organisation')
      .leftJoinAndSelect('organisation.establishments', 'establishments');

    // Apply filters
    if (params.id) {
      queryBuilder.andWhere('organisation.id = :id', { id: params.id });
    }
    if (params.name) {
      queryBuilder.andWhere('organisation.name ILIKE :name', {
        name: `%${params.name}%`,
      });
    }

    // Apply pagination and ordering
    queryBuilder
      .distinct(true)
      .skip(skip)
      .take(limit)
      .orderBy('organisation.name', 'ASC');

    // Execute query
    const [data, total]: [OrganisationEntity[], number] =
      await queryBuilder.getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
    };
  }

  /**
   * Update an organisation
   *
   * @param id - The ID of the organisation
   * @param request - The update request
   * @returns The updated organisation
   * @throws NotFoundException if the organisation is not found
   * @throws BadRequestException if an organisation with the new name already exists
   */
  public async update(
    id: string,
    request: UpdateOrganisationRequest,
  ): Promise<OrganisationEntity> {
    // Get the organisation with the given ID
    let organisation: OrganisationEntity = await this.getById(id);

    // Check if name is being updated and if it conflicts with existing organisation
    if (request.name && request.name !== organisation.name) {
      const existing = await this.findByName(request.name);

      if (existing) {
        throw new BadRequestException(
          `Organisation with name "${request.name}" already exists`,
        );
      }
    }

    // Update the organisation
    if (request.name !== undefined) {
      organisation.name = request.name;
    }

    // Save the organisation
    organisation = await this.organisationRepository.save(organisation);

    // Log
    this.logger.debug(`Organisation with ID ${organisation.id} updated`);

    // Return the organisation
    return organisation;
  }

  /**
   * Delete an organisation
   *
   * @param id - The ID of the organisation
   * @throws NotFoundException if the organisation is not found
   */
  public async delete(id: string): Promise<void> {
    // Get the organisation with the given ID
    const organisation: OrganisationEntity = await this.getById(id);

    // Delete the organisation (cascade will handle related establishments and user accounts)
    await this.organisationRepository.remove(organisation);

    // Log
    this.logger.debug(`Organisation with ID ${id} deleted`);
  }
}
