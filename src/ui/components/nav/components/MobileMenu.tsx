"use client";

import { Fragment, type ReactNode } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { useMobileMenu } from "./useMobileMenu";
import { OpenButton } from "./OpenButton";
import { CloseButton } from "./CloseButton";
import { Logo } from "@/ui/components/Logo";

type Props = {
	children: ReactNode;
};

export const MobileMenu = ({ children }: Props) => {
	const { closeMenu, openMenu, isOpen } = useMobileMenu();

	return (
		<>
			<OpenButton onClick={openMenu} aria-controls="mobile-menu" />
			<Transition show={isOpen}>
				<Dialog onClose={closeMenu}>
					<Dialog.Panel className="fixed inset-0 z-50 flex h-dvh w-screen flex-col overflow-y-scroll bg-vapor text-carbon">
						<Transition.Child
							className="sticky top-0 z-10 flex h-16 shrink-0 items-center justify-between border-b border-gray-300 bg-vapor/95 px-4 backdrop-blur-md sm:px-8"
							enter="motion-safe:transition-all motion-safe:duration-150"
							enterFrom="opacity-0"
							enterTo="opacity-100"
							leave="motion-safe:transition-all motion-safe:duration-150"
							leaveFrom="opacity-100"
							leaveTo="opacity-0"
						>
							<div>
								<Logo />
							</div>
							<CloseButton onClick={closeMenu} aria-controls="mobile-menu" />
						</Transition.Child>

						<Transition.Child
							as={Fragment}
							enter="motion-safe:transition-all motion-safe:duration-150"
							enterFrom="opacity-0 translate-y-2"
							enterTo="opacity-100 translate-y-0"
							leave="motion-safe:transition-all motion-safe:duration-150"
							leaveFrom="opacity-100 translate-y-0"
							leaveTo="opacity-0 translate-y-2"
						>
							<ul
								// CHANGED HERE: [&>li]:py-0
								// This removes the extra vertical gap between list items.
								className="flex h-full flex-col divide-y divide-gray-200 whitespace-nowrap p-4 pt-0 font-medium uppercase tracking-wide sm:p-8 sm:pt-0 [&>li]:py-0"
								id="mobile-menu"
							>
								{children}
							</ul>
						</Transition.Child>
					</Dialog.Panel>
				</Dialog>
			</Transition>
		</>
	);
};
