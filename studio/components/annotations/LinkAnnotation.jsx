/* eslint-disable react/prop-types */
import {
  ArrowDownIcon,
  ArrowTopRightIcon,
  CodeIcon,
  LinkIcon,
} from "@sanity/icons";
import React from "react";

export function LinkAnnotation(props) {
  const { value, ...restProps } = props;
  const { type } = value || "internal";
  return (
    <>
      {type === "internal" && <LinkIcon />}
      {type === "external" && <ArrowTopRightIcon />}
      {type === "download" && <ArrowDownIcon />}
      {type === "function" && <CodeIcon />}
      &nbsp;
      {props.renderDefault(restProps)}
    </>
  );
}
