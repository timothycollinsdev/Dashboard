import React from "react"
import { Link } from "react-router-dom"
import {
  Dropdown,
  DropdownToggle,
  DropdownMenu,
  DropdownItem,
  Collapse,
  NavItem,
  NavLink,
  Button,
  // @ts-ignore
} from "shards-react"
import { useSelector } from "react-redux"
import { selectUser } from "../../../redux/global/global.selectors"

type Props = {
  userActionsVisible: boolean
  logOut: () => void
  toggleUserActions: () => void
}

function UserActions({ logOut, userActionsVisible, toggleUserActions }: Props) {
  const user = useSelector(selectUser)
  return (
    <NavItem tag={Dropdown} caret toggle={toggleUserActions}>
      {user ? (
        <DropdownToggle caret tag={NavLink} className="text-nowrap px-3">
          {user._json?.avatar_url && (
            <img
              className="user-avatar rounded-circle mr-2"
              src={user._json.avatar_url}
              alt="User Avatar"
            />
          )}
          <span className="d-none d-md-inline-block">{user.username}</span>
        </DropdownToggle>
      ) : (
        <Link to="/login" className="nav-link px-3">
          <Button className="text-nowrap mb-0 mt-1">Log in</Button>
        </Link>
      )}

      <Collapse tag={DropdownMenu} right small open={userActionsVisible}>
        <DropdownItem
          tag={Link}
          to="/"
          className="text-danger"
          onClick={logOut}
        >
          <i className="material-icons text-danger">&#xE879;</i> Logout
        </DropdownItem>
      </Collapse>
    </NavItem>
  )
}

export { UserActions }
