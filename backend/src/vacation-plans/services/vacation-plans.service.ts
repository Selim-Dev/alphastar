import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import {
  VacationPlanRepository,
  VacationPlanFilter,
} from '../repositories/vacation-plan.repository';
import {
  VacationPlan,
  VacationPlanDocument,
  VacationEmployee,
  VacationTeam,
} from '../schemas/vacation-plan.schema';
import { CreateVacationPlanDto, VacationEmployeeDto } from '../dto/create-vacation-plan.dto';
import { UpdateVacationPlanDto } from '../dto/update-vacation-plan.dto';
import { UpdateCellDto } from '../dto/update-cell.dto';

/**
 * Service for VacationPlan business logic
 * Requirements: 15.1
 */
@Injectable()
export class VacationPlansService {
  constructor(
    private readonly vacationPlanRepository: VacationPlanRepository,
  ) {}

  /**
   * Computes overlap indicators for each week
   * If more than one employee has a value > 0 in a week, mark as 'Check'
   * Requirements: 15.5
   */
  private computeOverlaps(employees: VacationEmployee[]): string[] {
    const overlaps: string[] = new Array(48).fill('Ok');

    for (let weekIndex = 0; weekIndex < 48; weekIndex++) {
      let count = 0;
      for (const employee of employees) {
        if (employee.cells && employee.cells[weekIndex] > 0) {
          count++;
        }
      }
      if (count > 1) {
        overlaps[weekIndex] = 'Check';
      }
    }

    return overlaps;
  }

  /**
   * Computes total vacation days for an employee
   * Requirements: 15.4
   */
  private computeTotal(cells: number[]): number {
    return cells.reduce((sum, val) => sum + val, 0);
  }

  /**
   * Processes employees to ensure cells array and compute totals
   */
  private processEmployees(employeeDtos?: VacationEmployeeDto[]): VacationEmployee[] {
    if (!employeeDtos || employeeDtos.length === 0) {
      return [];
    }

    return employeeDtos.map((dto) => {
      const cells = dto.cells || new Array(48).fill(0);
      return {
        name: dto.name,
        cells,
        total: this.computeTotal(cells),
      };
    });
  }

  /**
   * Creates a new vacation plan
   * Requirements: 15.1
   */
  async create(
    dto: CreateVacationPlanDto,
    userId: string,
  ): Promise<VacationPlanDocument> {
    const employees = this.processEmployees(dto.employees);
    const overlaps = this.computeOverlaps(employees);

    const planData: Partial<VacationPlan> = {
      year: dto.year,
      team: dto.team,
      employees,
      overlaps,
      updatedBy: new Types.ObjectId(userId),
    };

    return this.vacationPlanRepository.create(planData);
  }

  /**
   * Finds a vacation plan by ID
   */
  async findById(id: string): Promise<VacationPlanDocument | null> {
    return this.vacationPlanRepository.findById(id);
  }

  /**
   * Finds a vacation plan by year and team
   */
  async findByYearAndTeam(
    year: number,
    team: VacationTeam,
  ): Promise<VacationPlanDocument | null> {
    return this.vacationPlanRepository.findByYearAndTeam(year, team);
  }

  /**
   * Finds all vacation plans with optional filtering
   */
  async findAll(filter?: VacationPlanFilter): Promise<VacationPlanDocument[]> {
    return this.vacationPlanRepository.findAll(filter);
  }

  /**
   * Updates a vacation plan by ID (bulk update)
   * Requirements: 18.2
   */
  async update(
    id: string,
    dto: UpdateVacationPlanDto,
    userId: string,
  ): Promise<VacationPlanDocument | null> {
    const existing = await this.vacationPlanRepository.findById(id);
    if (!existing) {
      throw new NotFoundException(`Vacation plan with ID ${id} not found`);
    }

    const updateData: Partial<VacationPlan> = {
      updatedBy: new Types.ObjectId(userId),
    };

    if (dto.year !== undefined) {
      updateData.year = dto.year;
    }
    if (dto.team !== undefined) {
      updateData.team = dto.team;
    }
    if (dto.employees !== undefined) {
      const employees = this.processEmployees(dto.employees);
      updateData.employees = employees;
      updateData.overlaps = this.computeOverlaps(employees);
    }

    return this.vacationPlanRepository.update(id, updateData);
  }

  /**
   * Deletes a vacation plan by ID
   */
  async delete(id: string): Promise<VacationPlanDocument | null> {
    const existing = await this.vacationPlanRepository.findById(id);
    if (!existing) {
      throw new NotFoundException(`Vacation plan with ID ${id} not found`);
    }
    return this.vacationPlanRepository.delete(id);
  }

  /**
   * Upserts a vacation plan by (year, team)
   */
  async upsert(
    year: number,
    team: VacationTeam,
    dto: Partial<CreateVacationPlanDto>,
    userId: string,
  ): Promise<VacationPlanDocument> {
    const employees = this.processEmployees(dto.employees);
    const overlaps = this.computeOverlaps(employees);

    const planData: Partial<VacationPlan> = {
      employees,
      overlaps,
      updatedBy: new Types.ObjectId(userId),
    };

    return this.vacationPlanRepository.upsert(year, team, planData);
  }

  /**
   * Updates a single cell in a vacation plan
   * Validates numeric values, updates the cell, and recalculates overlaps and totals
   * Requirements: 15.2, 16.5, 18.3
   */
  async updateCell(
    id: string,
    dto: UpdateCellDto,
    userId: string,
  ): Promise<VacationPlanDocument> {
    const existing = await this.vacationPlanRepository.findById(id);
    if (!existing) {
      throw new NotFoundException(`Vacation plan with ID ${id} not found`);
    }

    // Validate week index
    if (dto.weekIndex < 0 || dto.weekIndex > 47) {
      throw new BadRequestException('Week index must be between 0 and 47');
    }

    // Validate numeric value
    if (typeof dto.value !== 'number' || isNaN(dto.value)) {
      throw new BadRequestException('Cell value must be numeric');
    }

    if (dto.value < 0) {
      throw new BadRequestException('Cell value must be >= 0');
    }

    // Find the employee by name
    const employeeIndex = existing.employees.findIndex(
      (emp) => emp.name === dto.employeeName,
    );

    if (employeeIndex === -1) {
      throw new NotFoundException(
        `Employee "${dto.employeeName}" not found in vacation plan`,
      );
    }

    // Update the cell value
    const employees = [...existing.employees];
    const employee = { ...employees[employeeIndex] };
    const cells = [...employee.cells];
    cells[dto.weekIndex] = dto.value;
    employee.cells = cells;

    // Recalculate total for this employee
    employee.total = this.computeTotal(cells);
    employees[employeeIndex] = employee;

    // Recalculate overlaps
    const overlaps = this.computeOverlaps(employees);

    // Update the vacation plan
    const updateData: Partial<VacationPlan> = {
      employees,
      overlaps,
      updatedBy: new Types.ObjectId(userId),
    };

    const updated = await this.vacationPlanRepository.update(id, updateData);
    if (!updated) {
      throw new NotFoundException(`Vacation plan with ID ${id} not found`);
    }

    return updated;
  }

  /**
   * Adds a new employee to a vacation plan
   * Requirements: 16.4
   */
  async addEmployee(
    id: string,
    employeeName: string,
    userId: string,
  ): Promise<VacationPlanDocument> {
    const existing = await this.vacationPlanRepository.findById(id);
    if (!existing) {
      throw new NotFoundException(`Vacation plan with ID ${id} not found`);
    }

    // Check if employee already exists
    const existingEmployee = existing.employees.find(
      (emp) => emp.name === employeeName,
    );
    if (existingEmployee) {
      throw new BadRequestException(
        `Employee "${employeeName}" already exists in vacation plan`,
      );
    }

    // Add new employee with empty cells
    const newEmployee: VacationEmployee = {
      name: employeeName,
      cells: new Array(48).fill(0),
      total: 0,
    };

    const employees = [...existing.employees, newEmployee];
    const overlaps = this.computeOverlaps(employees);

    const updateData: Partial<VacationPlan> = {
      employees,
      overlaps,
      updatedBy: new Types.ObjectId(userId),
    };

    const updated = await this.vacationPlanRepository.update(id, updateData);
    if (!updated) {
      throw new NotFoundException(`Vacation plan with ID ${id} not found`);
    }

    return updated;
  }

  /**
   * Removes an employee from a vacation plan
   * Requirements: 16.4
   */
  async removeEmployee(
    id: string,
    employeeName: string,
    userId: string,
  ): Promise<VacationPlanDocument> {
    const existing = await this.vacationPlanRepository.findById(id);
    if (!existing) {
      throw new NotFoundException(`Vacation plan with ID ${id} not found`);
    }

    // Find the employee
    const employeeIndex = existing.employees.findIndex(
      (emp) => emp.name === employeeName,
    );

    if (employeeIndex === -1) {
      throw new NotFoundException(
        `Employee "${employeeName}" not found in vacation plan`,
      );
    }

    // Remove the employee
    const employees = existing.employees.filter(
      (emp) => emp.name !== employeeName,
    );
    const overlaps = this.computeOverlaps(employees);

    const updateData: Partial<VacationPlan> = {
      employees,
      overlaps,
      updatedBy: new Types.ObjectId(userId),
    };

    const updated = await this.vacationPlanRepository.update(id, updateData);
    if (!updated) {
      throw new NotFoundException(`Vacation plan with ID ${id} not found`);
    }

    return updated;
  }
}
