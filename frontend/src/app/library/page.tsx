import LibraryClient from './LibraryClient';

async function getLibraryData(email: string) {
    const res = await fetch(`http://localhost:8000/api/my-library/${email}`, {
        cache: 'no-store', 
    });
    if (!res.ok) return [];
    return res.json();
}

export default async function LibraryPage() {
    const userEmail = "boookntalk@gmail.com"; 
    const books = await getLibraryData(userEmail);

    return <LibraryClient initialBooks={books} />;
}