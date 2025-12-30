"use client";

import { useFormStatus } from "react-dom";

export function AddButton({ disabled }: { disabled?: boolean }) {
	const { pending } = useFormStatus();
	const isButtonDisabled = disabled || pending;

	return (
		<button
			type="submit"
			aria-disabled={isButtonDisabled}
			aria-busy={pending}
			onClick={(e) => isButtonDisabled && e.preventDefault()}
			className="relative flex h-14 w-full items-center justify-center overflow-hidden rounded-full bg-terracotta px-8 py-4 text-sm font-bold uppercase tracking-widest text-white transition-all duration-300 hover:bg-[#9e4335] hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:bg-terracotta aria-disabled:cursor-not-allowed aria-disabled:opacity-70 aria-disabled:hover:bg-terracotta"
		>
			{pending ? (
				<div className="inline-flex items-center">
					<svg
						className="-ml-1 mr-3 size-5 animate-spin text-white"
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
					>
						<circle
							className="opacity-25"
							cx="12"
							cy="12"
							r="10"
							stroke="currentColor"
							strokeWidth="4"
						></circle>
						<path
							className="opacity-75"
							fill="currentColor"
							d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
						></path>
					</svg>
					<span>Processing...</span>
				</div>
			) : (
				<span>Add to cart</span>
			)}
		</button>
	);
}
