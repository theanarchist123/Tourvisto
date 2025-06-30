import {Header} from "../../../components";
import {ColumnsDirective, ColumnDirective, GridComponent} from "@syncfusion/ej2-react-grids";
import {cn, formatDate} from "~/lib/utils";
import {getAllUsers} from "~/appwrite/auth";
import {useState} from "react";
import type {Route} from "./+types/all-users"

interface UserData {
    accountId: string;
    name: string;
    email: string;
    imageUrl?: string;
    joinedAt: string;
    status: 'user' | 'admin';
}

export const loader = async () => {
    const { users, total } = await getAllUsers(10, 0);

    return { users, total };
}

const AllUsers = ({ loaderData }: Route.ComponentProps) => {
    const { users } = loaderData;
    const [userList, setUserList] = useState(users);
    const [deletingUserId, setDeletingUserId] = useState<string | null>(null);

    const handleDeleteUser = async (userId: string, userName: string) => {
        const confirmMessage = `⚠️ DELETE USER CONFIRMATION ⚠️\n\nYou are about to permanently delete:\n• User: ${userName}\n• Account ID: ${userId}\n\nThis action will:\n✗ Remove all user data\n✗ Delete user profile\n✗ Cannot be undone\n\nType "DELETE" to confirm:`;
        
        const userInput = prompt(confirmMessage);
        
        if (userInput !== "DELETE") {
            if (userInput !== null) {
                alert("Deletion cancelled. You must type 'DELETE' exactly to confirm.");
            }
            return;
        }

        setDeletingUserId(userId);
        
        try {
            // Call API to delete user using POST method (since we're using React Router action)
            const response = await fetch(`/api/delete-user/${userId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            const result = await response.json();

            if (response.ok && result.success) {
                // Remove user from local state
                setUserList(prevUsers => prevUsers.filter(user => user.accountId !== userId));
                alert(`✅ SUCCESS: User "${userName}" has been permanently deleted.`);
            } else {
                alert(`❌ FAILED: Could not delete user.\nReason: ${result.error || 'Unknown error'}\nDetails: ${result.details || 'No additional details'}`);
            }
        } catch (error) {
            console.error('Error deleting user:', error);
            alert('❌ NETWORK ERROR: Could not connect to server. Please check your connection and try again.');
        } finally {
            setDeletingUserId(null);
        }
    };

    return (
        <main className="all-users wrapper">
            <Header
                title="Manage Users"
                description="Filter, sort, and access detailed user profiles"
            />

            <GridComponent dataSource={userList} gridLines="None">
                <ColumnsDirective>
                    <ColumnDirective
                        field="name"
                        headerText="Name"
                        width="200"
                        textAlign="Left"
                        template={(props: UserData) => (
                            <div className="flex items-center gap-1.5 px-4">
                                {props.imageUrl ? (
                                    <img 
                                        src={props.imageUrl} 
                                        alt="user" 
                                        className="rounded-full size-8 aspect-square object-cover" 
                                        referrerPolicy="no-referrer"
                                        onError={(e) => {
                                            // Fallback to initials if image fails to load
                                            const target = e.target as HTMLImageElement;
                                            target.style.display = 'none';
                                            target.nextElementSibling?.classList.remove('hidden');
                                        }}
                                    />
                                ) : null}
                                <div 
                                    className={`rounded-full size-8 aspect-square flex items-center justify-center text-white text-sm font-semibold ${
                                        !props.imageUrl ? '' : 'hidden'
                                    }`}
                                    style={{
                                        backgroundColor: `hsl(${props.name?.charCodeAt(0) * 137.5 % 360}, 50%, 50%)`
                                    }}
                                >
                                    {props.name?.charAt(0)?.toUpperCase() || 'U'}
                                </div>
                                <span>{props.name}</span>
                            </div>
                        )}
                    />
                <ColumnDirective
                    field="email"
                    headerText="Email Address"
                    width="200"
                    textAlign="Left"
                />
                    <ColumnDirective
                    field="joinedAt"
                    headerText="Date Joined"
                    width="140"
                    textAlign="Left"
                    template={({joinedAt}: { joinedAt: string}) => formatDate(joinedAt)}
                />
                    <ColumnDirective
                        field="status"
                        headerText="Type"
                        width="100"
                        textAlign="Left"
                        template={({ status }: UserData) => (
                            <article className={cn('status-column', status === 'user' ? 'bg-success-50': 'bg-light-300')}>
                                <div className={cn('size-1.5 rounded-full', status === 'user' ? 'bg-success-500': 'bg-gray-500')} />
                                    <h3 className={cn('font-inter text-xs font-medium', status === 'user' ? 'text-success-700' : 'text-gray-500')}>
                                        {status}
                                    </h3>
                            </article>
                        )}
                    />
                    <ColumnDirective
                        field="actions"
                        headerText="Actions"
                        width="120"
                        textAlign="Center"
                        template={(props: UserData) => (
                            <div className="flex items-center justify-center px-4">
                                <button
                                    onClick={() => handleDeleteUser(props.accountId, props.name)}
                                    disabled={deletingUserId === props.accountId}
                                    className={cn(
                                        "flex items-center justify-center w-8 h-8 rounded-full transition-all duration-200",
                                        "hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1",
                                        "disabled:opacity-50 disabled:cursor-not-allowed",
                                        deletingUserId === props.accountId ? "bg-red-100" : "hover:bg-red-50"
                                    )}
                                    title={`Delete ${props.name}`}
                                >
                                    {deletingUserId === props.accountId ? (
                                        <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                                    ) : (
                                        <svg 
                                            className="w-4 h-4 text-red-600" 
                                            fill="none" 
                                            stroke="currentColor" 
                                            viewBox="0 0 24 24"
                                            strokeWidth={2}
                                        >
                                            <path 
                                                strokeLinecap="round" 
                                                strokeLinejoin="round" 
                                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" 
                                            />
                                        </svg>
                                    )}
                                </button>
                            </div>
                        )}
                    />
                </ColumnsDirective>
            </GridComponent>
        </main>
    )
}
export default AllUsers