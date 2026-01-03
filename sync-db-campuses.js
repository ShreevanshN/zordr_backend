import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient();

async function syncCampuses() {
  console.log('Starting Campus Sync...');
  try {
    const distinctOutletCampuses = await prisma.outlet.groupBy({
      by: ['campus'],
    });

    console.log(
      'Found Outlet Campuses:',
      distinctOutletCampuses.map((c) => c.campus)
    );

    const existingCampusNames = await prisma.campus
      .findMany({
        select: { name: true },
      })
      .then((rows) => rows.map((r) => r.name));

    console.log('Existing Campuses:', existingCampusNames);

    const missingCampuses = distinctOutletCampuses
      .map((g) => g.campus)
      .filter((name) => name && !existingCampusNames.includes(name));

    if (missingCampuses.length > 0) {
      console.log(
        `Registering ${missingCampuses.length} missing campuses: ${missingCampuses.join(', ')}`
      );
      await prisma.campus.createMany({
        data: missingCampuses.map((name) => ({
          name,
          location: 'Auto-Detected',
          city: 'Unknown',
          state: 'Unknown',
          isActive: true,
        })),
        skipDuplicates: true,
      });
      console.log('Sync Complete!');
    } else {
      console.log('No missing campuses found.');
    }
  } catch (e) {
    console.error('Sync failed:', e);
  } finally {
    await prisma.$disconnect();
  }
}

syncCampuses();
