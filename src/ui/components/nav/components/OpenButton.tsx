import clsx from "clsx";
import { MenuIcon } from "lucide-react";
import { type HTMLAttributes } from "react";

type Props = {
	onClick: () => void;
} & Pick<HTMLAttributes<HTMLButtonElement>, "aria-controls">;

export const OpenButton = (props: Props) => {
	return (
		<button
			className={clsx("flex size-8 flex-col items-center justify-center gap-1.5 self-center lg:hidden")}
			aria-controls={props["aria-controls"]}
			aria-expanded={false}
			aria-label="Open menu"
			onClick={props.onClick}
		>
			<MenuIcon className="size-6 shrink-0" aria-hidden />
		</button>
	);
};
