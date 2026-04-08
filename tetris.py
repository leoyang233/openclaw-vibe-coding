#!/usr/bin/env python3
"""
俄罗斯方块 - 终端版
用 curses 库实现
"""

import curses
import random
import time

# 方块形状 (S, Z, L, J, T, O, I)
SHAPES = [
    [[1, 1, 0, 0], [0, 1, 1, 0]],       # S
    [[0, 1, 1, 0], [1, 1, 0, 0]],       # Z
    [[1, 0, 0], [1, 0, 0], [1, 1, 0]], # J
    [[0, 0, 1], [0, 0, 1], [0, 1, 1]], # L
    [[0, 1, 0], [1, 1, 1], [0, 0, 0]], # T
    [[1, 1], [1, 1]],                   # O
    [[1, 1, 1, 1]],                     # I
]

COLORS = [1, 2, 3, 4, 5, 6, 7]

BOARD_WIDTH = 10
BOARD_HEIGHT = 20
BLOCK_SIZE = 1


def rotate(piece):
    """旋转方块"""
    return [list(row[::-1]) for row in zip(*piece)]


class Tetris:
    def __init__(self, stdscr):
        self.stdscr = stdscr
        curses.curs_set(0)
        self.height, self.width = stdscr.getmaxyx()
        
        # 游戏区域
        self.board = [[0] * BOARD_WIDTH for _ in range(BOARD_HEIGHT)]
        
        # 侧边栏宽度
        self.side_width = 30
        self.game_x = (self.width - BOARD_WIDTH * 2 - self.side_width) // 2
        
        # 初始化颜色
        curses.start_color()
        for i in range(1, 8):
            curses.init_pair(i, i, 0)
        
        self.score = 0
        self.level = 1
        self.lines = 0
        self.game_over = False
        self.paused = False
        
        self.new_piece()
    
    def new_piece(self):
        """生成新方块"""
        self.piece = random.choice(SHAPES)
        self.piece_color = random.randint(1, 7)
        self.piece_x = BOARD_WIDTH // 2 - len(self.piece[0]) // 2
        self.piece_y = 0
        
        # 检查游戏结束
        if self.check_collision(self.piece, self.piece_x, self.piece_y):
            self.game_over = True
    
    def check_collision(self, piece, x, y):
        """检查碰撞"""
        for row_idx, row in enumerate(piece):
            for col_idx, cell in enumerate(row):
                if cell:
                    new_x = x + col_idx
                    new_y = y + row_idx
                    if (new_x < 0 or new_x >= BOARD_WIDTH or
                        new_y >= BOARD_HEIGHT or
                        (new_y >= 0 and self.board[new_y][new_x])):
                        return True
        return False
    
    def lock_piece(self):
        """锁定方块到游戏板"""
        for row_idx, row in enumerate(self.piece):
            for col_idx, cell in enumerate(row):
                if cell:
                    y = self.piece_y + row_idx
                    x = self.piece_x + col_idx
                    if y >= 0:
                        self.board[y][x] = self.piece_color
        
        self.clear_lines()
        self.new_piece()
    
    def clear_lines(self):
        """消除满行"""
        lines_cleared = 0
        y = BOARD_HEIGHT - 1
        while y >= 0:
            if all(self.board[y]):
                del self.board[y]
                self.board.insert(0, [0] * BOARD_WIDTH)
                lines_cleared += 1
            else:
                y -= 1
        
        if lines_cleared > 0:
            self.lines += lines_cleared
            # 计分
            points = [0, 100, 300, 500, 800]
            self.score += points[min(lines_cleared, 4)] * self.level
            # 升级
            self.level = self.lines // 10 + 1
    
    def move(self, dx, dy):
        """移动方块"""
        if not self.check_collision(self.piece, self.piece_x + dx, self.piece_y + dy):
            self.piece_x += dx
            self.piece_y += dy
            return True
        return False
    
    def rotate_piece(self):
        """旋转方块"""
        rotated = rotate(self.piece)
        if not self.check_collision(rotated, self.piece_x, self.piece_y):
            self.piece = rotated
        elif not self.check_collision(rotated, self.piece_x - 1, self.piece_y):
            self.piece = rotated
            self.piece_x -= 1
        elif not self.check_collision(rotated, self.piece_x + 1, self.piece_y):
            self.piece = rotated
            self.piece_x += 1
    
    def drop(self):
        """直接落到底"""
        while self.move(0, 1):
            pass
        self.lock_piece()
    
    def draw(self):
        """绘制游戏"""
        self.stdscr.clear()
        
        # 绘制游戏区域边框
        for y in range(BOARD_HEIGHT + 2):
            self.stdscr.addch(y, self.game_x - 2, '|')
            self.stdscr.addch(y, self.game_x + BOARD_WIDTH * 2, '|')
        
        self.stdscr.addch(0, self.game_x - 2, '+')
        self.stdscr.addch(0, self.game_x + BOARD_WIDTH * 2, '+')
        self.stdscr.addch(BOARD_HEIGHT + 1, self.game_x - 2, '+')
        self.stdscr.addch(BOARD_HEIGHT + 1, self.game_x + BOARD_WIDTH * 2, '+')
        
        # 绘制已固定的方块
        for y in range(BOARD_HEIGHT):
            for x in range(BOARD_WIDTH):
                if self.board[y][x]:
                    color = self.board[y][x]
                    self.stdscr.addstr(y + 1, self.game_x + x * 2, '██', curses.color_pair(color))
        
        # 绘制当前方块
        if not self.game_over:
            for row_idx, row in enumerate(self.piece):
                for col_idx, cell in enumerate(row):
                    if cell:
                        y = self.piece_y + row_idx
                        x = self.piece_x + col_idx
                        if y >= 0:
                            self.stdscr.addstr(y + 1, self.game_x + x * 2, '██',
                                              curses.color_pair(self.piece_color))
        
        # 绘制侧边栏
        sx = self.game_x + BOARD_WIDTH * 2 + 4
        
        self.stdscr.addstr(1, sx, f'分数: {self.score}')
        self.stdscr.addstr(3, sx, f'等级: {self.level}')
        self.stdscr.addstr(5, sx, f'行数: {self.lines}')
        self.stdscr.addstr(7, sx, '操作:')
        self.stdscr.addstr(8, sx, '← → 移动')
        self.stdscr.addstr(9, sx, '↑ 旋转')
        self.stdscr.addstr(10, sx, '↓ 加速下落')
        self.stdscr.addstr(11, sx, '空格 直接落下')
        self.stdscr.addstr(12, sx, 'p 暂停')
        self.stdscr.addstr(13, sx, 'q 退出')
        
        # 绘制下一个方块提示
        self.stdscr.addstr(16, sx, '下一个:')
        
        # 游戏结束
        if self.game_over:
            msg = '=== 游戏结束 ==='
            self.stdscr.addstr(BOARD_HEIGHT // 2,
                             self.game_x + BOARD_WIDTH - len(msg) // 2,
                             msg)
            self.stdscr.addstr(BOARD_HEIGHT // 2 + 2,
                             self.game_x + BOARD_WIDTH - 10,
                             f'最终分数: {self.score}')
            self.stdscr.addstr(BOARD_HEIGHT // 2 + 4,
                             self.game_x + BOARD_WIDTH - 8,
                             '按 q 退出')
        
        self.stdscr.refresh()
    
    def run(self):
        """游戏主循环"""
        last_drop = time.time()
        drop_interval = 0.5
        
        while True:
            # 设置下落间隔（随等级加快）
            drop_interval = max(0.1, 0.5 - (self.level - 1) * 0.05)
            
            # 自动下落
            if not self.paused and not self.game_over:
                if time.time() - last_drop > drop_interval:
                    if not self.move(0, 1):
                        self.lock_piece()
                    last_drop = time.time()
            
            # 绘制
            self.draw()
            
            # 获取按键
            key = self.stdscr.getch()
            
            if key == ord('q'):
                break
            elif key == ord('p') and not self.game_over:
                self.paused = not self.paused
            elif self.paused or self.game_over:
                continue
            elif key == curses.KEY_LEFT:
                self.move(-1, 0)
            elif key == curses.KEY_RIGHT:
                self.move(1, 0)
            elif key == curses.KEY_DOWN:
                self.move(0, 1)
            elif key == curses.KEY_UP:
                self.rotate_piece()
            elif key == ord(' '):
                self.drop()


def main(stdscr):
    game = Tetris(stdscr)
    game.run()


if __name__ == '__main__':
    curses.wrapper(main)
