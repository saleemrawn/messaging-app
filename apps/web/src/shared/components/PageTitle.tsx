const APP_NAME = "messgr.";

interface PageTitleProps {
  name: string;
}

// React 19 hoists a rendered <title> into <head>, ahead of index.html's
// default one, so the page that is showing names the browser tab.
function PageTitle({ name }: PageTitleProps) {
  return <title>{`${name} | ${APP_NAME}`}</title>;
}

export { APP_NAME };
export default PageTitle;
