import Image from 'next/image';

interface NavItem {
  label: string;
  href: string;
}

interface HeaderProps {
  logo: string;
  navItems: NavItem[];
}

export default function Header({ logo, navItems }: HeaderProps) {
  return (
    <div className="bg-base-100/90 backdrop-blur-md shadow-lg sticky top-0 z-50">
      <div className="navbar container mx-auto">
        <div className="navbar-start">
          <div className="dropdown">
            <div tabIndex={0} role="button" className="btn btn-ghost lg:hidden">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6h16M4 12h8m-8 6h16"
                />
              </svg>
            </div>
            <ul
              tabIndex={0}
              className="menu menu-sm dropdown-content bg-base-100 rounded-box z-[1] mt-3 w-52 p-2 shadow"
            >
              {navItems.map((item) => (
                <li key={item.href}>
                  <a href={item.href}>{item.label}</a>
                </li>
              ))}
            </ul>
          </div>
          <a href="#" className="btn btn-ghost gap-2">
            <Image
              src="/images/app-icon.png"
              alt="DualTemp Weather"
              width={32}
              height={32}
              className="rounded-lg"
            />
            <span className="text-lg font-bold hidden sm:inline">{logo}</span>
          </a>
        </div>
        <div className="navbar-center hidden lg:flex">
          <ul className="menu menu-horizontal px-1">
            {navItems.map((item) => (
              <li key={item.href}>
                <a href={item.href} className="font-medium">
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
        <div className="navbar-end">
          <a
            href="https://apps.apple.com/app/id1665040449?platform=iphone"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary btn-sm"
          >
            Download
          </a>
        </div>
      </div>
    </div>
  );
}
