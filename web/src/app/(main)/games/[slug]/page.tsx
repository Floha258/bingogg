'use client';
import { useApi } from '@/lib/Hooks';
import { Game } from '@/types/Game';
import { Tab } from '@headlessui/react';
import Link from 'next/link';
import { useLayoutEffect, useState } from 'react';
import PermissionsManagement from '../../../../components/game/PermissionsManagement';
import GoalManagement from '../../../../components/game/goals/GoalManagement';

export default function Game({
    params: { slug },
}: {
    params: { slug: string };
}) {
    const { data: gameData, isLoading } = useApi<Game>(`/api/games/${slug}`);

    const [isOwner, setIsOwner] = useState(false);
    const [canModerate, setCanModerate] = useState(false);

    useLayoutEffect(() => {
        async function loadPermissions() {
            const res = await fetch(`/api/games/${slug}/permissions`);
            if (!res.ok) {
                //TODO: handle error
                return;
            }
            const permissions = await res.json();
            setIsOwner(permissions.isOwner);
            setCanModerate(permissions.canModerate);
        }
        loadPermissions();
    }, [slug]);

    if (!gameData || isLoading) {
        return null;
    }

    const tabs = ['Goals'];
    if (isOwner) {
        tabs.push('Permissions');
    }

    return (
        <div className="flex h-full gap-x-3">
            <div className="flex grow flex-col rounded-2xl border-4 p-5">
                <div className="flex">
                    <div className="mr-4">
                        {gameData.coverImage && (
                            <div
                                className="h-32 w-20 bg-cover bg-center bg-no-repeat"
                                style={{
                                    backgroundImage: `url(${gameData.coverImage})`,
                                }}
                            />
                        )}
                        {!gameData.coverImage && (
                            <div className="relative flex h-32 w-20 border shadow-[inset_0_0_12px_white]">
                                <div className="absolute bottom-0 left-0 right-0 top-0 flex items-center justify-center">
                                    {slug}
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="grow">
                        <Link
                            className="text-sm underline"
                            href={`/games/${slug}`}
                        >
                            {gameData.slug}
                        </Link>
                        <div className="text-xl">{gameData.name}</div>
                    </div>
                    <div className="w-2/5">
                        <div>
                            <div className="text-lg underline">Owners</div>
                            <div className="">
                                {gameData.owners
                                    ?.map((o) => o.username)
                                    .join(', ')}
                            </div>
                        </div>
                        <div>
                            <div className="text-lg underline">Moderators</div>
                            <div className="text-sm">
                                {gameData.moderators
                                    ?.map((o) => o.username)
                                    .join(', ')}
                            </div>
                        </div>
                    </div>
                </div>
                <Tab.Group>
                    <Tab.List className="mt-3 flex rounded-xl bg-blue-900/20 p-1">
                        {tabs.map((tab) => (
                            <Tab
                                key={tab}
                                className={({ selected }) =>
                                    `w-full rounded-lg  py-2.5 text-sm font-medium leading-5 ${
                                        selected
                                            ? 'cursor-default bg-gray-500 shadow'
                                            : 'bg-slate-800 text-blue-100 hover:bg-slate-700 hover:text-white'
                                    }`
                                }
                            >
                                {tab}
                            </Tab>
                        ))}
                    </Tab.List>
                    <Tab.Panels className="mt-2 h-full">
                        <Tab.Panel className="h-full rounded-xl p-3">
                            <GoalManagement
                                slug={slug}
                                canModerate={canModerate}
                            />
                        </Tab.Panel>
                        <Tab.Panel>
                            <PermissionsManagement
                                slug={slug}
                                gameData={gameData}
                            />
                        </Tab.Panel>
                    </Tab.Panels>
                </Tab.Group>
            </div>
            <div className="w-1/4 rounded-2xl border-4 p-5"></div>
        </div>
    );
}
