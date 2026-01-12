/**
 * API Routes for Candidate Notes
 * Handles CRUD operations for candidate notes
 */

import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getCandidatesCollection } from '@/lib/candidates/candidate-db.js';
import { validateNoteData, ValidationError } from '@/lib/candidates/candidate-validation.js';
import { createNoteEntry } from '@/lib/candidates/candidate-models.js';

/**
 * GET /api/candidates/[id]/notes
 * Retrieve all notes for a candidate
 */
export async function GET(request, { params }) {
  try {
    const { id } = await params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid candidate ID format' },
        { status: 400 }
      );
    }

    const collection = await getCandidatesCollection();
    const candidate = await collection.findOne(
      { _id: new ObjectId(id), 'metadata.isActive': true },
      { projection: { notes: 1 } }
    );

    if (!candidate) {
      return NextResponse.json(
        { error: 'Candidate not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      notes: candidate.notes || []
    });

  } catch (error) {
    console.error('Error retrieving candidate notes:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve notes' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/candidates/[id]/notes
 * Add a new note to a candidate
 */
export async function POST(request, { params }) {
  try {
    const { id } = await params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid candidate ID format' },
        { status: 400 }
      );
    }

    const body = await request.json();
    
    // Validate note data
    validateNoteData(body);

    // Create note entry
    const noteEntry = createNoteEntry(body.content, body.type || 'general');

    const collection = await getCandidatesCollection();
    
    // Check if candidate exists
    const candidate = await collection.findOne({
      _id: new ObjectId(id),
      'metadata.isActive': true
    });

    if (!candidate) {
      return NextResponse.json(
        { error: 'Candidate not found' },
        { status: 404 }
      );
    }

    // Add note to candidate
    const result = await collection.findOneAndUpdate(
      { _id: new ObjectId(id), 'metadata.isActive': true },
      {
        $push: { notes: noteEntry },
        $set: { 'metadata.updatedAt': new Date() }
      },
      { returnDocument: 'after' }
    );

    if (!result) {
      return NextResponse.json(
        { error: 'Failed to add note' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Note added successfully',
      note: noteEntry
    }, { status: 201 });

  } catch (error) {
    if (error instanceof ValidationError) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    console.error('Error adding candidate note:', error);
    return NextResponse.json(
      { error: 'Failed to add note' },
      { status: 500 }
    );
  }
}