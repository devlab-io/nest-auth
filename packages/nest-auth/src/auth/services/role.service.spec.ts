import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { RoleService } from './role.service';
import { RoleEntity } from '../entities';

describe('RoleService', () => {
  let service: RoleService;

  const mockRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RoleService,
        {
          provide: getRepositoryToken(RoleEntity),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<RoleService>(RoleService);

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new role', async () => {
      const roleData = { name: 'admin', description: 'Administrator' };
      const createdRole = { id: 1, ...roleData } as RoleEntity;

      mockRepository.findOne.mockResolvedValue(null);
      mockRepository.create.mockReturnValue(createdRole);
      mockRepository.save.mockResolvedValue(createdRole);

      const result = await service.create(roleData.name, roleData.description);

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { name: roleData.name },
      });
      expect(mockRepository.create).toHaveBeenCalledWith(roleData);
      expect(mockRepository.save).toHaveBeenCalledWith(createdRole);
      expect(result).toEqual(createdRole);
    });

    it('should create a role without description', async () => {
      const roleData = { name: 'user' };
      const createdRole = { id: 1, ...roleData } as RoleEntity;

      mockRepository.findOne.mockResolvedValue(null);
      mockRepository.create.mockReturnValue(createdRole);
      mockRepository.save.mockResolvedValue(createdRole);

      const result = await service.create(roleData.name);

      expect(result).toEqual(createdRole);
    });

    it('should throw BadRequestException if role already exists', async () => {
      const existingRole = { id: 1, name: 'admin' } as RoleEntity;

      mockRepository.findOne.mockResolvedValue(existingRole);

      await expect(service.create('admin')).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.create('admin')).rejects.toThrow(
        'Role with name admin already exists',
      );
    });
  });

  describe('getByName', () => {
    it('should return a role by name', async () => {
      const role = { id: 1, name: 'admin' } as RoleEntity;

      mockRepository.findOne.mockResolvedValue(role);

      const result = await service.getByName('admin');

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { name: 'admin' },
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

  describe('getAllByNames', () => {
    it('should return all roles by names', async () => {
      const roles = [
        { id: 1, name: 'admin' },
        { id: 2, name: 'user' },
      ] as RoleEntity[];

      mockRepository.find.mockResolvedValue(roles);

      const result = await service.getAllByNames(['admin', 'user']);

      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { name: expect.anything() },
      });
      expect(result).toEqual(roles);
      expect(result.length).toBe(2);
    });

    it('should return empty array if no names provided', async () => {
      const result = await service.getAllByNames([]);

      expect(result).toEqual([]);
      expect(mockRepository.find).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if not all roles are found', async () => {
      const roles = [{ id: 1, name: 'admin' }] as RoleEntity[];

      mockRepository.find.mockResolvedValue(roles);

      await expect(
        service.getAllByNames(['admin', 'nonexistent']),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.getAllByNames(['admin', 'nonexistent']),
      ).rejects.toThrow('One or more roles not found');
    });

    it('should throw NotFoundException if no roles are found', async () => {
      mockRepository.find.mockResolvedValue([]);

      await expect(service.getAllByNames(['admin'])).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('delete', () => {
    it('should delete a role by name', async () => {
      const role = { id: 1, name: 'admin' } as RoleEntity;

      mockRepository.findOne.mockResolvedValue(role);
      mockRepository.remove.mockResolvedValue(role);

      await service.delete('admin');

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { name: 'admin' },
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
