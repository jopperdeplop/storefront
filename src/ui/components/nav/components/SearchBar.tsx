import { redirect } from "next/navigation";
import { SearchIcon } from "lucide-react";

export const SearchBar = ({ channel }: { channel: string }) => {
	async function onSubmit(formData: FormData) {
		"use server";
		const search = formData.get("search") as string;
		if (search && search.trim().length > 0) {
			redirect(`/${encodeURIComponent(channel)}/search?query=${encodeURIComponent(search)}`);
		}
	}

	return (
		<form
			action={onSubmit}
			className="group relative my-2 flex w-full items-center justify-items-center text-sm lg:w-80"
		>
			<label className="w-full">
				<span className="sr-only">search for products</span>
				<input
					type="text"
					name="search"
					placeholder="Search products & brands..."
					autoComplete="on"
					required
					// UPDATED: Added 'border-stone-200' instead of transparent for subtle definition
					className="h-10 w-full rounded-full border border-stone-200 bg-stone-100 px-6 py-2 pr-10 font-sans text-sm text-gray-900 transition-all placeholder:text-gray-400 hover:border-stone-300 hover:bg-stone-200 focus:border-terracotta focus:bg-white focus:outline-none focus:ring-1 focus:ring-terracotta"
				/>
			</label>
			<div className="absolute inset-y-0 right-0 flex items-center pr-3">
				<button
					type="submit"
					className="inline-flex aspect-square h-8 w-8 items-center justify-center rounded-full text-gray-400 transition-colors hover:text-terracotta group-invalid:pointer-events-none group-invalid:opacity-50"
				>
					<span className="sr-only">search</span>
					<SearchIcon aria-hidden className="h-4 w-4" />
				</button>
			</div>
		</form>
	);
};
