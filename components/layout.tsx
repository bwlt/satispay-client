type Props = {
  children: React.ReactNode;
};

const Layout: React.FC<Props> = (props) => (
  <div className="m-8 flex">{props.children}</div>
);

export default Layout;
