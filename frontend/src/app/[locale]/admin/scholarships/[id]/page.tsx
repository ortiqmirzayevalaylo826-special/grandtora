'use client';
import { useParams } from 'next/navigation';
import ScholarshipForm from '@/components/admin/ScholarshipForm';
export default function EditScholarship() { const { id } = useParams<{ id: string }>(); return <ScholarshipForm id={id} />; }
