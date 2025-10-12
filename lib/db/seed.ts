import { prisma } from './prisma';
import { readFileSync } from 'fs';
import { join } from 'path';

export async function seedDatabase() {
  try {
    console.log('Starting database seeding...');

    // Create demo organization
    const organization = await prisma.organization.upsert({
      where: { id: 'demo-org-001' },
      update: {},
      create: {
        id: 'demo-org-001',
        name: 'Grand Plaza Hotel',
        type: 'hotel',
      },
    });

    console.log('Created organization:', organization.name);

    // Create demo user
    const user = await prisma.user.upsert({
      where: { email: 'trainee@grandplaza.com' },
      update: {},
      create: {
        id: 'demo-user-001',
        email: 'trainee@grandplaza.com',
        name: 'Demo Trainee',
        role: 'trainee',
        organizationId: organization.id,
      },
    });

    console.log('Created user:', user.name);

    // Read employees from JSON file and create User records
    const employeesPath = join(process.cwd(), 'data', 'employees.json');
    const employeesData = JSON.parse(readFileSync(employeesPath, 'utf-8'));

    for (const employee of employeesData) {
      await prisma.user.upsert({
        where: { email: employee.email },
        update: {},
        create: {
          id: employee.id,
          email: employee.email,
          name: employee.name,
          role: 'trainee',
          organizationId: organization.id,
        },
      });
      console.log('Created user from employees.json:', employee.name);
    }

    // Read scenarios from JSON file
    const scenariosPath = join(process.cwd(), 'data', 'scenarios.json');
    const scenariosData = JSON.parse(readFileSync(scenariosPath, 'utf-8'));

    // Create demo scenarios
    for (const scenario of scenariosData) {
      await prisma.scenario.upsert({
        where: { id: scenario.id },
        update: {},
        create: {
          id: scenario.id,
          title: scenario.title,
          description: scenario.context || 'No description provided',
          difficulty: scenario.difficulty,
          category: scenario.category,
          scenarioType: scenario.category, // Use category as type
          aiGuestPersona: JSON.stringify(scenario.guest_persona || {}),
          aiGuestOpening: scenario.ai_guest_opening,
          contextBackground: scenario.context || '',
          successCriteria: scenario.success_criteria,
          evaluationRubric: scenario.success_criteria, // Use success_criteria as rubric
          organizationId: null, // Public scenarios
          isPublic: true,
        },
      });
      console.log('Created scenario:', scenario.title);
    }

    console.log('Database seeding completed successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  }
}

// Run seed if called directly
if (require.main === module) {
  seedDatabase()
    .then(async () => {
      await prisma.$disconnect();
      process.exit(0);
    })
    .catch(async (error) => {
      console.error(error);
      await prisma.$disconnect();
      process.exit(1);
    });
}
