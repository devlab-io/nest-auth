import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { RoleService } from './role.service';
import { ClaimService } from './claim.service';
import { RoleEntity, ClaimEntity } from '../entities';
import { CreateRoleRequest } from '@devlab-io/nest-auth-types';

describe('RoleService', () => {
  let service: RoleService;

  const mockRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
    count: jest.fn(),
  };

  const mockClaimService = {
    getClaims: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RoleService,
        {
          provide: getRepositoryToken(RoleEntity),
          useValue: mockRepository,
        },
        {
          provide: ClaimService,
          useValue: mockClaimService,
        },
      ],
    }).compile();

    service = module.get<RoleService>(RoleService);

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new role', async () => {
      const request: CreateRoleRequest = {
        name: 'admin',
        description: 'Administrator',
        claims: [],
      };
      const createdRole = {
        id: 1,
        name: request.name,
        description: request.description,
        claims: [],
        actionTokens: [],
      } as RoleEntity;

      mockRepository.count.mockResolvedValue(0);
      mockClaimService.getClaims.mockResolvedValue([]);
      mockRepository.create.mockReturnValue(createdRole);
      mockRepository.save.mockResolvedValue(createdRole);

      const result = await service.create(request);

      expect(mockRepository.count).toHaveBeenCalledWith({
        where: { name: request.name },
      });
      expect(mockClaimService.getClaims).toHaveBeenCalledWith([]);
      expect(mockRepository.create).toHaveBeenCalledWith({
        name: request.name,
        description: request.description,
        claims: [],
      });
      expect(mockRepository.save).toHaveBeenCalledWith(createdRole);
      expect(result).toEqual(createdRole);
    });

    it('should create a role with claims', async () => {
      const mockClaims = [{ claim: 'users:read:any' }] as ClaimEntity[];
      const request: CreateRoleRequest = {
        name: 'user',
        claims: ['users:read:any'],
      };
      const createdRole = {
        id: 1,
        name: request.name,
        claims: mockClaims,
        actionTokens: [],
      } as RoleEntity;

      mockRepository.count.mockResolvedValue(0);
      mockClaimService.getClaims.mockResolvedValue(mockClaims);
      mockRepository.create.mockReturnValue(createdRole);
      mockRepository.save.mockResolvedValue(createdRole);

      const result = await service.create(request);

      expect(mockClaimService.getClaims).toHaveBeenCalledWith([
        'users:read:any',
      ]);
      expect(result).toEqual(createdRole);
    });

    it('should throw BadRequestException if role already exists', async () => {
      const request: CreateRoleRequest = { name: 'admin', claims: [] };

      mockRepository.count.mockResolvedValue(1);

      await expect(service.create(request)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.create(request)).rejects.toThrow(
        'Role with name admin already exists',
      );
    });
  });

  describe('getByName', () => {
    it('should return a role by name', async () => {
      const role = {
        id: 1,
        name: 'admin',
        claims: [],
        actionTokens: [],
      } as RoleEntity;

      mockRepository.findOne.mockResolvedValue(role);

      const result = await service.getByName('admin');

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { name: 'admin' },
        relations: ['claims'],
      });
      expect(result).toEqual(role);
    });

    it('should throw NotFoundException if role does not exist', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.getByName('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.getByName('nonexistent')).rejects.toThrow(
        'Role with name nonexistent not found',
      );
    });
  });

  describe('getByNames', () => {
    it('should return all roles by names', async () => {
      const roles = [
        { id: 1, name: 'admin', claims: [], actionTokens: [] },
        { id: 2, name: 'user', claims: [], actionTokens: [] },
      ] as RoleEntity[];

      mockRepository.find.mockResolvedValue(roles);

      const result = await service.getByNames(['admin', 'user']);

      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { name: expect.anything() },
        relations: ['claims'],
      });
      expect(result).toEqual(roles);
      expect(result.length).toBe(2);
    });

    it('should return empty array if no names provided', async () => {
      const result = await service.getByNames([]);

      expect(result).toEqual([]);
      expect(mockRepository.find).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if not all roles are found', async () => {
      const roles = [
        { id: 1, name: 'admin', claims: [], actionTokens: [] },
      ] as RoleEntity[];

      mockRepository.find.mockResolvedValue(roles);

      await expect(
        service.getByNames(['admin', 'nonexistent']),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.getByNames(['admin', 'nonexistent']),
      ).rejects.toThrow('One or more roles not found');
    });

    it('should throw NotFoundException if no roles are found', async () => {
      mockRepository.find.mockResolvedValue([]);

      await expect(service.getByNames(['admin'])).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('delete', () => {
    it('should delete a role by name', async () => {
      const role = {
        id: 1,
        name: 'admin',
        claims: [],
        actionTokens: [],
      } as RoleEntity;

      mockRepository.findOne.mockResolvedValue(role);
      mockRepository.remove.mockResolvedValue(role);

      await service.delete('admin');

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { name: 'admin' },
        relations: ['claims'],
      });
      expect(mockRepository.remove).toHaveBeenCalledWith(role);
    });

    it('should throw NotFoundException if role does not exist', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.delete('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.delete('nonexistent')).rejects.toThrow(
        'Role with name nonexistent not found',
      );
      expect(mockRepository.remove).not.toHaveBeenCalled();
    });
  });
});
