import { cookies } from 'next/headers';

export async function POST() {
  try {
    // Delete the token cookie
    cookies().delete('token');

    return Response.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    return Response.json(
      { error: 'Something went wrong during logout' },
      { status: 500 }
    );
  }
}
