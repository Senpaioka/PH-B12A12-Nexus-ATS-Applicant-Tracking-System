/**
 * Migration API to update pipeline stages to lowercase
 */

import { NextResponse } from 'next/server';
import { getCandidatesCollection } from '@/lib/candidates/candidate-db.js';

const stageMapping = {
  'Applied': 'applied',
  'Screening': 'screening',
  'Interview': 'interview',
  'Offer': 'offer',
  'Hired': 'hired'
};

export async function POST() {
  try {
    console.log('Starting pipeline stage migration...');
    
    const candidatesCollection = await getCandidatesCollection();
    
    // Find all candidates with capitalized stages
    const candidates = await candidatesCollection.find({
      'metadata.isActive': true,
      'pipelineInfo.currentStage': { $in: Object.keys(stageMapping) }
    }).toArray();
    
    console.log(`Found ${candidates.length} candidates to migrate`);
    
    let migratedCount = 0;
    
    for (const candidate of candidates) {
      const oldStage = candidate.pipelineInfo.currentStage;
      const newStage = stageMapping[oldStage];
      
      if (newStage) {
        console.log(`Migrating candidate ${candidate._id}: ${oldStage} -> ${newStage}`);
        
        // Update current stage
        const updateOps = {
          $set: {
            'pipelineInfo.currentStage': newStage,
            'metadata.updatedAt': new Date()
          }
        };
        
        // Update stage history
        if (candidate.pipelineInfo.stageHistory) {
          const updatedHistory = candidate.pipelineInfo.stageHistory.map(entry => ({
            ...entry,
            stage: stageMapping[entry.stage] || entry.stage
          }));
          updateOps.$set['pipelineInfo.stageHistory'] = updatedHistory;
        }
        
        await candidatesCollection.updateOne(
          { _id: candidate._id },
          updateOps
        );
        
        migratedCount++;
        console.log(`✅ Updated candidate ${candidate._id}`);
      }
    }
    
    return NextResponse.json({
      success: true,
      message: `Migration completed successfully! Updated ${migratedCount} candidates.`,
      migratedCount,
      totalFound: candidates.length
    });
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Migration failed',
      message: error.message
    }, { status: 500 });
  }
}