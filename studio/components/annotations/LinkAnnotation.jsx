import {
  ArrowDownIcon,
  ArrowTopRightIcon,
  CodeIcon,
  LinkIcon,
} from "@sanity/icons";

export function LinkAnnotation(props) {
  const { value } = props;
  const { type } = value || {};
  return (
    <>
      {type === "internal" && <LinkIcon />}
      {type === "external" && <ArrowTopRightIcon />}
      {type === "download" && <ArrowDownIcon />}
      {type === "function" && <CodeIcon />}
      &nbsp;
      {props.renderDefault(props)}
    </>
  );
}
